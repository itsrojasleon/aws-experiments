package main

import (
	"os"

	cdk "github.com/aws/aws-cdk-go/awscdk/v2"
	lambda "github.com/aws/aws-cdk-go/awscdk/v2/awslambda"
	lambdaeventsources "github.com/aws/aws-cdk-go/awscdk/v2/awslambdaeventsources"
	lambdanodejs "github.com/aws/aws-cdk-go/awscdk/v2/awslambdanodejs"
	sns "github.com/aws/aws-cdk-go/awscdk/v2/awssns"
	snssubs "github.com/aws/aws-cdk-go/awscdk/v2/awssnssubscriptions"
	sqs "github.com/aws/aws-cdk-go/awscdk/v2/awssqs"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

type SnsSqsLambdaStackProps struct {
	cdk.StackProps
}

func NewSnsSqsLambdaStack(scope constructs.Construct, id string, props *SnsSqsLambdaStackProps) cdk.Stack {
	var sprops cdk.StackProps
	if props != nil {
		sprops = props.StackProps
	}
	stack := cdk.NewStack(scope, &id, &sprops)

	topic := sns.NewTopic(stack, jsii.String("topic"), &sns.TopicProps{})

	firstQueue := sqs.NewQueue(stack, jsii.String("firstQueue"), &sqs.QueueProps{})
	secondQueue := sqs.NewQueue(stack, jsii.String("secondQueue"), &sqs.QueueProps{})

	topic.AddSubscription(snssubs.NewSqsSubscription(firstQueue, &snssubs.SqsSubscriptionProps{
		RawMessageDelivery: jsii.Bool(true),
	}))
	topic.AddSubscription(snssubs.NewSqsSubscription(secondQueue, &snssubs.SqsSubscriptionProps{
		RawMessageDelivery: jsii.Bool(true),
	}))

	firstFn := lambdanodejs.NewNodejsFunction(
		stack,
		jsii.String("firstFn"),
		&lambdanodejs.NodejsFunctionProps{
			Handler: jsii.String("handler"),
			Entry:   jsii.String("./src/lambdas/first.ts"),
			Runtime: lambda.Runtime_NODEJS_16_X(),
		},
	)
	firstFn.AddEventSource(
		lambdaeventsources.NewSqsEventSource(firstQueue, &lambdaeventsources.SqsEventSourceProps{}),
	)

	secondFn := lambdanodejs.NewNodejsFunction(
		stack,
		jsii.String("secondFn"),
		&lambdanodejs.NodejsFunctionProps{
			Handler: jsii.String("handler"),
			Entry:   jsii.String("./src/lambdas/second.ts"),
			Runtime: lambda.Runtime_NODEJS_16_X(),
		},
	)
	secondFn.AddEventSource(
		lambdaeventsources.NewSqsEventSource(secondQueue, &lambdaeventsources.SqsEventSourceProps{}),
	)

	return stack
}

func main() {
	defer jsii.Close()

	app := cdk.NewApp(nil)

	NewSnsSqsLambdaStack(app, "SnsSqsLambdaStack", &SnsSqsLambdaStackProps{
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
