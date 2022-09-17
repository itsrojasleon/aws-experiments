package main

import (
	"os"

	cdk "github.com/aws/aws-cdk-go/awscdk/v2"
	lambda "github.com/aws/aws-cdk-go/awscdk/v2/awslambda"
	lambdanodejs "github.com/aws/aws-cdk-go/awscdk/v2/awslambdanodejs"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

type ExternalStackProps struct {
	cdk.StackProps
}

func NewExternalStack(scope constructs.Construct, id string, props *ExternalStackProps) cdk.Stack {
	var sprops cdk.StackProps
	if props != nil {
		sprops = props.StackProps
	}
	stack := cdk.NewStack(scope, &id, &sprops)

	getProductFn := lambdanodejs.NewNodejsFunction(
		stack,
		jsii.String("getProductFn"),
		&lambdanodejs.NodejsFunctionProps{
			Handler: jsii.String("handler"),
			Entry:   jsii.String("./src/lambdas/get-product.ts"),
			Bundling: &lambdanodejs.BundlingOptions{
				Minify: jsii.Bool(true),
			},
		},
	)
	monitorHealthFn := lambdanodejs.NewNodejsFunction(
		stack,
		jsii.String("monitorHealthFn"),
		&lambdanodejs.NodejsFunctionProps{
			Handler: jsii.String("handler"),
			Entry:   jsii.String("./src/lambdas/monitor-health.ts"),
			Bundling: &lambdanodejs.BundlingOptions{
				Minify: jsii.Bool(true),
			},
		},
	)

	getProductFnUrl := getProductFn.AddFunctionUrl(&lambda.FunctionUrlOptions{
		AuthType: lambda.FunctionUrlAuthType_NONE,
	})
	monitorHealthFnUrl := monitorHealthFn.AddFunctionUrl(&lambda.FunctionUrlOptions{
		AuthType: lambda.FunctionUrlAuthType_NONE,
	})

	cdk.NewCfnOutput(stack, jsii.String("getProductFnUrl"), &cdk.CfnOutputProps{
		Value:      getProductFnUrl.Url(),
		ExportName: jsii.String("externalApiUrl"),
	})
	cdk.NewCfnOutput(stack, jsii.String("monitorHealthFnUrl"), &cdk.CfnOutputProps{
		Value:      monitorHealthFnUrl.Url(),
		ExportName: jsii.String("monitorHealthFnUrl"),
	})

	return stack
}

func main() {
	defer jsii.Close()

	app := cdk.NewApp(nil)

	NewExternalStack(app, "ExternalStack", &ExternalStackProps{
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
