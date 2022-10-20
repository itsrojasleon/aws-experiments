package main

import (
	"os"

	cdk "github.com/aws/aws-cdk-go/awscdk/v2"
	lambda "github.com/aws/aws-cdk-go/awscdk/v2/awslambda"
	lambdaeventsources "github.com/aws/aws-cdk-go/awscdk/v2/awslambdaeventsources"
	lambdanodejs "github.com/aws/aws-cdk-go/awscdk/v2/awslambdanodejs"
	sqs "github.com/aws/aws-cdk-go/awscdk/v2/awssqs"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

type QueueDlqLambdaStackProps struct {
	cdk.StackProps
}

func NewQueueDlqLambdaStack(scope constructs.Construct, id string, props *QueueDlqLambdaStackProps) cdk.Stack {
	var sprops cdk.StackProps
	if props != nil {
		sprops = props.StackProps
	}
	stack := cdk.NewStack(scope, &id, &sprops)

	dlq := sqs.NewQueue(stack, jsii.String("dlq"), &sqs.QueueProps{
		DeliveryDelay: cdk.Duration_Seconds(jsii.Number(40)),
	})
	mainQueue := sqs.NewQueue(stack, jsii.String("mainQueue"), &sqs.QueueProps{
		DeadLetterQueue: &sqs.DeadLetterQueue{
			Queue:           dlq,
			MaxReceiveCount: jsii.Number(1),
		},
	})

	fn := lambdanodejs.NewNodejsFunction(stack, jsii.String("fn"), &lambdanodejs.NodejsFunctionProps{
		Handler: jsii.String("handler"),
		Entry:   jsii.String("./lambda.ts"),
		Runtime: lambda.Runtime_NODEJS_16_X(),
	})

	fn.AddEventSource(
		lambdaeventsources.NewSqsEventSource(mainQueue, &lambdaeventsources.SqsEventSourceProps{
			ReportBatchItemFailures: jsii.Bool(true),
		}),
	)

	fn.AddEventSource(
		lambdaeventsources.NewSqsEventSource(dlq, &lambdaeventsources.SqsEventSourceProps{
			ReportBatchItemFailures: jsii.Bool(true),
		}),
	)

	return stack
}

func main() {
	defer jsii.Close()

	app := cdk.NewApp(nil)

	NewQueueDlqLambdaStack(app, "QueueDlqLambdaStack", &QueueDlqLambdaStackProps{
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
