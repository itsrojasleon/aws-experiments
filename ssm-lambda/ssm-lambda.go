package main

import (
	"os"

	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsiam"
	"github.com/aws/aws-cdk-go/awscdk/v2/awslambda"
	"github.com/aws/aws-cdk-go/awscdk/v2/awslambdanodejs"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsssm"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

type SsmLambdaCronStackProps struct {
	awscdk.StackProps
}

func NewSsmLambdaCronStack(scope constructs.Construct, id string, props *SsmLambdaCronStackProps) awscdk.Stack {
	var sprops awscdk.StackProps
	if props != nil {
		sprops = props.StackProps
	}
	stack := awscdk.NewStack(scope, &id, &sprops)

	parameter := awsssm.NewStringParameter(stack, jsii.String("coolParam"), &awsssm.StringParameterProps{
		StringValue:   jsii.String("Hi there"),
		ParameterName: jsii.String("/coolParam"),
		Type:          awsssm.ParameterType_STRING,
		Tier:          awsssm.ParameterTier_STANDARD,
	})

	policy := awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
		Actions:   &[]*string{jsii.String("ssm:*")},
		Resources: &[]*string{jsii.String("*")},
	})

	fn := awslambdanodejs.NewNodejsFunction(stack, jsii.String("lambdaCron"), &awslambdanodejs.NodejsFunctionProps{
		Runtime: awslambda.Runtime_NODEJS_16_X(),
		Handler: jsii.String("handler"),
		Entry:   jsii.String("./src/lambdas/check.ts"),
		Environment: &map[string]*string{
			"PARAM_NAME": parameter.ParameterName(),
		},
		Bundling: &awslambdanodejs.BundlingOptions{
			Minify: jsii.Bool(true),
		},
	})

	fn.Role().AttachInlinePolicy(
		awsiam.NewPolicy(stack, jsii.String("ssm-policy"), &awsiam.PolicyProps{
			Statements: &[]awsiam.PolicyStatement{
				policy,
			},
		}),
	)

	return stack
}

func main() {
	defer jsii.Close()

	app := awscdk.NewApp(nil)

	NewSsmLambdaCronStack(app, "SsmLambdaCronStack", &SsmLambdaCronStackProps{
		awscdk.StackProps{
			Env: env(),
		},
	})

	app.Synth(nil)
}

// env determines the AWS environment (account+region) in which our stack is to
// be deployed. For more information see: https://docs.aws.amazon.com/cdk/latest/guide/environments.html
func env() *awscdk.Environment {
	return &awscdk.Environment{
		Account: jsii.String(os.Getenv("CDK_DEFAULT_ACCOUNT")),
		Region:  jsii.String(os.Getenv("CDK_DEFAULT_REGION")),
	}
}
