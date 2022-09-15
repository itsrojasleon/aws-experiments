package main

import (
	"os"

	"github.com/aws/aws-cdk-go/awscdk/v2"
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

	awsssm.NewStringParameter(stack, jsii.String("coolParam"), &awsssm.StringParameterProps{
		StringValue:   jsii.String("Hi there"),
		ParameterName: jsii.String("/cool/param"),
		Type:          awsssm.ParameterType_STRING,
		Tier:          awsssm.ParameterTier_STANDARD,
	})

	// role := awsiam.NewRole(stack, jsii.String("lambdaRole"), &awsiam.RoleProps{
	// 	AssumedBy: awsiam.NewServicePrincipal(
	// 		jsii.String("lambda.amazonaws.com"),
	// 		&awsiam.ServicePrincipalOpts{},
	// 	),
	// })

	// role.AddToPolicy(
	// 	awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
	// 		Effect:    awsiam.Effect_ALLOW,
	// 		Resources: &[]*string{jsii.String("*")},
	// 		Actions:   &[]*string{jsii.String("ssm:*")},
	// 	}),
	// )

	// awscdk.NewCfnOutput(stack, jsii.String("policySSM"), &awscdk.CfnOutputProps{
	// 	Value:      role.RoleArn(),
	// 	ExportName: jsii.String("lambdaRoleArn"),
	// })

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
