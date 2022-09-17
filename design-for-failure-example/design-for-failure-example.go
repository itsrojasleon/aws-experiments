package main

import (
	"os"

	cdk "github.com/aws/aws-cdk-go/awscdk/v2"
	lambda "github.com/aws/aws-cdk-go/awscdk/v2/awslambda"
	lambdanodejs "github.com/aws/aws-cdk-go/awscdk/v2/awslambdanodejs"
	s3 "github.com/aws/aws-cdk-go/awscdk/v2/awss3"
	sqs "github.com/aws/aws-cdk-go/awscdk/v2/awssqs"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

type DesignForFailureExampleStackProps struct {
	cdk.StackProps
}

func NewExternalService(scope constructs.Construct, id string, props *DesignForFailureExampleStackProps) cdk.Stack {
	var sprops cdk.StackProps
	if props != nil {
		sprops = props.StackProps
	}
	stack := cdk.NewStack(scope, &id, &sprops)

	externalFn := lambdanodejs.NewNodejsFunction(
		stack,
		jsii.String("externalFn"),
		&lambdanodejs.NodejsFunctionProps{
			Handler: jsii.String("getProduct"),
			Entry:   jsii.String("./src/lambdas/external"),
			Bundling: &lambdanodejs.BundlingOptions{
				Minify: jsii.Bool(true),
			},
		},
	)

	// Public endpoint.
	fnUrl := externalFn.AddFunctionUrl(&lambda.FunctionUrlOptions{
		AuthType: lambda.FunctionUrlAuthType_NONE,
	})

	cdk.NewCfnOutput(stack, jsii.String("externalApiUrl"), &cdk.CfnOutputProps{
		Value:      fnUrl.Url(),
		ExportName: jsii.String("externalApiUrl"),
	})

	return stack
}

func NewDesignForFailureExampleStack(scope constructs.Construct, id string, props *DesignForFailureExampleStackProps) cdk.Stack {
	var sprops cdk.StackProps
	if props != nil {
		sprops = props.StackProps
	}
	stack := cdk.NewStack(scope, &id, &sprops)

	bucket := s3.NewBucket(stack, jsii.String("bucket"), &s3.BucketProps{})

	// TODO: Attach lambda or something.
	trafficRedirectionDLQueue := sqs.NewQueue(stack, jsii.String("trafficRedirectionDLQueue"), &sqs.QueueProps{})

	trafficRedirectionQueue := sqs.NewQueue(stack, jsii.String("trafficRedirectionQueue"), &sqs.QueueProps{
		DeadLetterQueue: &sqs.DeadLetterQueue{
			Queue:           trafficRedirectionDLQueue,
			MaxReceiveCount: jsii.Number(2),
		},
	})

	createRequestFn := lambdanodejs.NewNodejsFunction(
		stack,
		jsii.String("createRequestFn"),
		&lambdanodejs.NodejsFunctionProps{
			Handler: jsii.String("createRequest"),
			Entry:   jsii.String("./src/lambdas/internal"),
			Environment: &map[string]*string{
				"BUCKET_NAME":                bucket.BucketName(),
				"REQUEST_CREATION_QUEUE_URL": trafficRedirectionQueue.QueueUrl(),
			},
		},
	)

	redirectTrafficFn := lambdanodejs.NewNodejsFunction(
		stack,
		jsii.String("redirectTrafficFn"),
		&lambdanodejs.NodejsFunctionProps{
			Handler: jsii.String("redirectTraffic"),
			Entry:   jsii.String("./src/lambdas/internal"),
			Environment: &map[string]*string{
				"BUCKET_NAME":      bucket.BucketName(),
				"EXTERNAL_API_URL": cdk.Fn_ImportValue(jsii.String("externalApiUrl")),
			},
		},
	)

	return stack
}

func main() {
	defer jsii.Close()

	app := cdk.NewApp(nil)

	NewDesignForFailureExampleStack(app, "DesignForFailureExampleStack", &DesignForFailureExampleStackProps{
		cdk.StackProps{
			Env: env(),
		},
	})

	app.Synth(nil)
}

func env() *cdk.Environment {

	return &cdk.Environment{
		Account: jsii.String(os.Getenv("CDK_DEFAULT_ACCOUNT")),
		Region:  jsii.String(os.Getenv("CDK_DEFAULT_REGION")),
	}
}
