package main

import (
	"os"

	cdk "github.com/aws/aws-cdk-go/awscdk/v2"
	apigateway "github.com/aws/aws-cdk-go/awscdk/v2/awsapigateway"
	lambda "github.com/aws/aws-cdk-go/awscdk/v2/awslambda"
	lambdanodejs "github.com/aws/aws-cdk-go/awscdk/v2/awslambdanodejs"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

type LambdaMaxPayloadStackProps struct {
	cdk.StackProps
}

func NewLambdaMaxPayloadStack(scope constructs.Construct, id string, props *LambdaMaxPayloadStackProps) cdk.Stack {
	var sprops cdk.StackProps
	if props != nil {
		sprops = props.StackProps
	}
	stack := cdk.NewStack(scope, &id, &sprops)

	api := apigateway.NewRestApi(stack, jsii.String("api"), &apigateway.RestApiProps{
		DefaultCorsPreflightOptions: &apigateway.CorsOptions{
			AllowOrigins:     jsii.Strings("*"),
			AllowMethods:     jsii.Strings("POST"),
			AllowCredentials: jsii.Bool(true),
		},
	})

	fn := lambdanodejs.NewNodejsFunction(stack, jsii.String("fn"), &lambdanodejs.NodejsFunctionProps{
		Entry:   jsii.String("./src/lambda.ts"),
		Handler: jsii.String("handler"), Runtime: lambda.Runtime_NODEJS_16_X(),
		Bundling: &lambdanodejs.BundlingOptions{
			Minify: jsii.Bool(true),
		},
	})

	api.Root().AddMethod(
		jsii.String("POST"),
		apigateway.NewLambdaIntegration(fn, &apigateway.LambdaIntegrationOptions{}),
		&apigateway.MethodOptions{},
	)

	return stack
}

func main() {
	defer jsii.Close()

	app := cdk.NewApp(nil)

	NewLambdaMaxPayloadStack(app, "LambdaMaxPayloadStack", &LambdaMaxPayloadStackProps{
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
