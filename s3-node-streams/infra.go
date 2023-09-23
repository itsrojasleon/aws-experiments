package main

import (
	"os"

	cdk "github.com/aws/aws-cdk-go/awscdk/v2"
	apigateway "github.com/aws/aws-cdk-go/awscdk/v2/awsapigateway"
	lambda "github.com/aws/aws-cdk-go/awscdk/v2/awslambda"
	lambdanodejs "github.com/aws/aws-cdk-go/awscdk/v2/awslambdanodejs"
	s3 "github.com/aws/aws-cdk-go/awscdk/v2/awss3"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

type InfraStackProps struct {
	cdk.StackProps
}

func NewInfraStack(scope constructs.Construct, id string, props *InfraStackProps) cdk.Stack {
	var sprops cdk.StackProps
	if props != nil {
		sprops = props.StackProps
	}

	stack := cdk.NewStack(scope, &id, &sprops)

	bucket := s3.NewBucket(stack, jsii.String("bucket"), &s3.BucketProps{})
	api := apigateway.NewRestApi(stack, jsii.String("restApi"), &apigateway.RestApiProps{})

	streamUploadLambda := lambdanodejs.NewNodejsFunction(
		stack,
		jsii.String("streamUploadLambda"),
		&lambdanodejs.NodejsFunctionProps{
			MemorySize: jsii.Number(128),
			Timeout:    cdk.Duration_Seconds(jsii.Number(20)),
			Runtime:    lambda.Run(),
			Handler:    jsii.String("handler"),
			Entry:      jsii.String("src/lambdas/stream-upload"),
			Environment: &map[string]*string{
				"BUCKET_NAME": bucket.BucketName(),
			},
		},
	)
	multipartUploadLambda := lambdanodejs.NewNodejsFunction(
		stack,
		jsii.String("multipartUploadLambda"),
		&lambdanodejs.NodejsFunctionProps{
			MemorySize: jsii.Number(128),
			Timeout:    cdk.Duration_Seconds(jsii.Number(20)),
			Runtime:    lambda.Runtime_NODEJS_16_X(),
			Handler:    jsii.String("handler"),
			Entry:      jsii.String("src/lambdas/multipart-upload"),
			Environment: &map[string]*string{
				"BUCKET_NAME": bucket.BucketName(),
			},
		},
	)

	apix := apigateway.NewLambdaRestApi(stack, jsii.String("myapi"), &apigateway.LambdaRestApiProps{
		Handler: multipartUploadLambda,
	})

	return stack
}

func main() {
	defer jsii.Close()

	app := cdk.NewApp(nil)

	NewInfraStack(app, "InfraStack", &InfraStackProps{
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
