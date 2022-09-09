package main

import (
	"os"

	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsiam"
	"github.com/aws/aws-cdk-go/awscdk/v2/awssqs"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

type InfraStackProps struct {
	awscdk.StackProps
}

func NewInfraStack(scope constructs.Construct, id string, props *InfraStackProps) awscdk.Stack {
	var sprops awscdk.StackProps
	if props != nil {
		sprops = props.StackProps
	}
	stack := awscdk.NewStack(scope, &id, &sprops)

	deadLetterQueue := awssqs.NewQueue(stack, jsii.String("SimpleQueue"), &awssqs.QueueProps{})

	simpleQueue := awssqs.NewQueue(stack, jsii.String("RetryQueue"), &awssqs.QueueProps{
		ReceiveMessageWaitTime: awscdk.Duration_Seconds(jsii.Number(0)),
		DeadLetterQueue: &awssqs.DeadLetterQueue{
			Queue:           deadLetterQueue,
			MaxReceiveCount: jsii.Number(1),
		},
	})

	role := awsiam.NewRole(stack, jsii.String("LambdaRole"), &awsiam.RoleProps{
		AssumedBy: awsiam.NewServicePrincipal(
			jsii.String("lambda.amazonaws.com"),
			&awsiam.ServicePrincipalOpts{},
		),
		ManagedPolicies: &[]awsiam.IManagedPolicy{
			awsiam.ManagedPolicy_FromAwsManagedPolicyName(jsii.String("service-role/AWSLambdaSQSQueueExecutionRole")),
		},
	})

	role.AddToPolicy(
		awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
			Effect:    awsiam.Effect_ALLOW,
			Resources: &[]*string{jsii.String("*")},
			Actions:   &[]*string{jsii.String("sqs:SendMessage")},
		}),
	)

	awscdk.NewCfnOutput(stack, jsii.String("RoleArn"), &awscdk.CfnOutputProps{
		Value:      role.RoleArn(),
		ExportName: jsii.String("LambdaRoleArn"),
	})

	awscdk.NewCfnOutput(stack, jsii.String("SimpleQueueArn"), &awscdk.CfnOutputProps{
		Value:      simpleQueue.QueueArn(),
		ExportName: jsii.String("SimpleQueueArn"),
	})

	awscdk.NewCfnOutput(stack, jsii.String("SimpleQueueUrl"), &awscdk.CfnOutputProps{
		Value:      simpleQueue.QueueUrl(),
		ExportName: jsii.String("SimpleQueueUrl"),
	})

	awscdk.NewCfnOutput(stack, jsii.String("RetryQueueArn"), &awscdk.CfnOutputProps{
		Value:      deadLetterQueue.QueueArn(),
		ExportName: jsii.String("RetryQueueArn"),
	})

	return stack
}

func main() {
	defer jsii.Close()

	app := awscdk.NewApp(nil)

	NewInfraStack(app, "QueuesStack", &InfraStackProps{
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
