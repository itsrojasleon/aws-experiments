package main

import (
	"os"

	"github.com/aws/aws-cdk-go/awscdk/v2"
	iam "github.com/aws/aws-cdk-go/awscdk/v2/awsiam"
	lambdaeventsources "github.com/aws/aws-cdk-go/awscdk/v2/awslambdaeventsources"
	lambdanode "github.com/aws/aws-cdk-go/awscdk/v2/awslambdanodejs"
	s3 "github.com/aws/aws-cdk-go/awscdk/v2/awss3"
	sqs "github.com/aws/aws-cdk-go/awscdk/v2/awssqs"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

type NodeSqsGoStackProps struct {
	awscdk.StackProps
}

func NewNodeSqsGoStack(scope constructs.Construct, id string, props *NodeSqsGoStackProps) awscdk.Stack {
	var sprops awscdk.StackProps
	if props != nil {
		sprops = props.StackProps
	}
	stack := awscdk.NewStack(scope, &id, &sprops)

	bucket := s3.NewBucket(stack, jsii.String("bucket"), &s3.BucketProps{})
	queue := sqs.NewQueue(stack, jsii.String("queue"), &sqs.QueueProps{})

	role := iam.NewRole(stack, jsii.String("role"), &iam.RoleProps{
		AssumedBy: iam.NewServicePrincipal(
			jsii.String("lambda.amazonaws.com"),
			&iam.ServicePrincipalOpts{},
		),
	})

	// Node
	nodeFn := lambdanode.NewNodejsFunction(
		stack,
		jsii.String("nodeFn"),
		&lambdanode.NodejsFunctionProps{
			Handler: jsii.String("handler"),
			Entry:   jsii.String("./src/node/lambdas/create-zip.ts"),
			Role:    role,
			Environment: &map[string]*string{
				"BUCKET_NAME": bucket.BucketName(),
				"QUEUE_URL":   queue.QueueUrl(),
			},
		})
	nodeFn.Role().AttachInlinePolicy(iam.NewPolicy(stack, jsii.String("fire-zip-policy"), &iam.PolicyProps{
		Statements: &[]iam.PolicyStatement{
			iam.NewPolicyStatement(&iam.PolicyStatementProps{
				Actions:   jsii.Strings("s3:PutObject"),
				Resources: jsii.Strings("*"),
			}),
			iam.NewPolicyStatement(&iam.PolicyStatementProps{
				Actions:   jsii.Strings("sqs:SendMessage"),
				Resources: jsii.Strings("*"),
			}),
		},
	}))

	nodeFn2 := lambdanode.NewNodejsFunction(
		stack,
		jsii.String("nodeFn2"),
		&lambdanode.NodejsFunctionProps{
			Handler: jsii.String("handler"),
			Entry:   jsii.String("./src/node/lambdas/merge-zip.ts"),
			Role:    role,
			Environment: &map[string]*string{
				"BUCKET_NAME": bucket.BucketName(),
				"QUEUE_URL":   queue.QueueUrl(),
			},
		})
	nodeFn2.Role().AttachInlinePolicy(iam.NewPolicy(stack, jsii.String("handle-zip-policy"), &iam.PolicyProps{
		Statements: &[]iam.PolicyStatement{
			iam.NewPolicyStatement(&iam.PolicyStatementProps{
				Actions:   jsii.Strings("s3:*"),
				Resources: jsii.Strings("*"),
			}),
		},
	}))
	nodeFn2.Role().AddManagedPolicy(
		iam.ManagedPolicy_FromAwsManagedPolicyName(
			jsii.String("service-role/AWSLambdaSQSQueueExecutionRole"),
		),
	)
	nodeFn2.AddEventSource(
		lambdaeventsources.NewSqsEventSource(
			queue, &lambdaeventsources.SqsEventSourceProps{
				BatchSize: jsii.Number(1),
			},
		),
	)
	// Go
	// goFn := lambdago.NewGoFunction(stack, jsii.String("goFn"), &lambdago.GoFunctionProps{
	// 	Entry: jsii.String("./src/go/lambdas/merge-zip.go"),
	// 	Role:  role,
	// 	Environment: &map[string]*string{
	// 		"BUCKET_NAME": bucket.BucketName(),
	// 	},
	// })
	// goFn.Role().AddManagedPolicy(
	// 	iam.ManagedPolicy_FromAwsManagedPolicyName(
	// 		jsii.String("service-role/AWSLambdaSQSQueueExecutionRole"),
	// 	),
	// )
	// goFn.AddToRolePolicy(iam.NewPolicyStatement(&iam.PolicyStatementProps{
	// 	Actions:   jsii.Strings("s3:GetObject"),
	// 	Resources: jsii.Strings("*"),
	// }))
	// goFn.AddEventSource(
	// 	lambdaeventsources.NewSqsEventSource(
	// 		queue, &lambdaeventsources.SqsEventSourceProps{
	// 			BatchSize: jsii.Number(1),
	// 		},
	// 	),
	// )

	return stack
}

func main() {
	defer jsii.Close()

	app := awscdk.NewApp(nil)

	NewNodeSqsGoStack(app, "NodeSqsGoStack", &NodeSqsGoStackProps{
		awscdk.StackProps{
			Env: env(),
		},
	})

	app.Synth(nil)
}

func env() *awscdk.Environment {
	return &awscdk.Environment{
		Account: jsii.String(os.Getenv("CDK_DEFAULT_ACCOUNT")),
		Region:  jsii.String(os.Getenv("CDK_DEFAULT_REGION")),
	}
}
