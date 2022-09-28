package main

import (
	"os"

	"github.com/aws/aws-cdk-go/awscdk/v2"
	events "github.com/aws/aws-cdk-go/awscdk/v2/awsevents"
	targets "github.com/aws/aws-cdk-go/awscdk/v2/awseventstargets"
	iam "github.com/aws/aws-cdk-go/awscdk/v2/awsiam"
	lambdaeventsources "github.com/aws/aws-cdk-go/awscdk/v2/awslambdaeventsources"
	lambdanodejs "github.com/aws/aws-cdk-go/awscdk/v2/awslambdanodejs"
	sqs "github.com/aws/aws-cdk-go/awscdk/v2/awssqs"
	"github.com/aws/jsii-runtime-go"

	"github.com/aws/constructs-go/constructs/v10"
)

type EnableDisableLambdaTriggerOnAScheduleStackProps struct {
	awscdk.StackProps
}

func NewEnableDisableLambdaTriggerOnAScheduleStack(scope constructs.Construct, id string, props *EnableDisableLambdaTriggerOnAScheduleStackProps) awscdk.Stack {
	var sprops awscdk.StackProps
	if props != nil {
		sprops = props.StackProps
	}
	stack := awscdk.NewStack(scope, &id, &sprops)

	queue := sqs.NewQueue(stack, jsii.String("queue"), &sqs.QueueProps{})
	eventSource := lambdaeventsources.NewSqsEventSource(queue, &lambdaeventsources.SqsEventSourceProps{})

	workerFn := lambdanodejs.NewNodejsFunction(stack, jsii.String("workerFn"), &lambdanodejs.NodejsFunctionProps{
		Entry:   jsii.String("./src/lambdas/worker.ts"),
		Handler: jsii.String("handler"),
		Bundling: &lambdanodejs.BundlingOptions{
			Minify: jsii.Bool(true),
		},
	})
	// We can invoke this lambda manually in the AWS console.
	workerFn.AddEventSource(eventSource)

	role := iam.NewRole(stack, jsii.String("role"), &iam.RoleProps{
		AssumedBy: iam.NewServicePrincipal(
			jsii.String("lambda.amazonaws.com"),
			&iam.ServicePrincipalOpts{},
		),
		ManagedPolicies: &[]iam.IManagedPolicy{
			iam.ManagedPolicy_FromAwsManagedPolicyName(jsii.String("service-role/AWSLambdaBasicExecutionRole")),
		},
	})

	enableDisableFn := lambdanodejs.NewNodejsFunction(stack, jsii.String("enableDisableFn"), &lambdanodejs.NodejsFunctionProps{
		Entry:   jsii.String("./src/lambdas/enable-disable.ts"),
		Handler: jsii.String("handler"),
		Role:    role,
		Bundling: &lambdanodejs.BundlingOptions{
			Minify: jsii.Bool(true),
		},
	})
	eventRule := events.NewRule(stack, jsii.String("rule"), &events.RuleProps{
		Schedule: events.Schedule_Rate(awscdk.Duration_Minutes(jsii.Number(1))),
	})
	eventRule.AddTarget(targets.NewLambdaFunction(
		enableDisableFn,
		&targets.LambdaFunctionProps{
			Event: events.RuleTargetInput_FromObject(`{"UUID":"` + *eventSource.EventSourceMappingId() + `"}`),
		}),
	)
	enableDisableFn.Role().AttachInlinePolicy(iam.NewPolicy(stack, jsii.String("callEventSourceMapping"), &iam.PolicyProps{
		Statements: &[]iam.PolicyStatement{
			iam.NewPolicyStatement(&iam.PolicyStatementProps{
				Actions: jsii.Strings("lambda:UpdateEventSourceMapping"),
				// "arn:aws:lambda:" + ":" + os.Getenv("CDK_DEFAULT_ACCOUNT") + ":event-source-mapping:" + *eventSource.EventSourceMappingId()
				Resources: jsii.Strings("*"),
			}),
		}}))

	return stack
}

func main() {
	defer jsii.Close()

	app := awscdk.NewApp(nil)

	NewEnableDisableLambdaTriggerOnAScheduleStack(app, "EnableDisableLambdaTriggerOnAScheduleStack", &EnableDisableLambdaTriggerOnAScheduleStackProps{
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
