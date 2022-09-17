package main

import (
	"os"

	cdk "github.com/aws/aws-cdk-go/awscdk/v2"
	lambdaeventsources "github.com/aws/aws-cdk-go/awscdk/v2/awslambdaeventsources"
	lambdanodejs "github.com/aws/aws-cdk-go/awscdk/v2/awslambdanodejs"
	s3 "github.com/aws/aws-cdk-go/awscdk/v2/awss3"
	sqs "github.com/aws/aws-cdk-go/awscdk/v2/awssqs"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

type InternalStackProps struct {
	cdk.StackProps
}

func NewInternalStack(scope constructs.Construct, id string, props *InternalStackProps) cdk.Stack {
	var sprops cdk.StackProps
	if props != nil {
		sprops = props.StackProps
	}
	stack := cdk.NewStack(scope, &id, &sprops)

	bucket := s3.NewBucket(stack, jsii.String("bucket"), &s3.BucketProps{})

	requestRedirectionQueue := sqs.NewQueue(stack, jsii.String("requestRedirectionQueue"), &sqs.QueueProps{})
	questionHandlerQueue := sqs.NewQueue(stack, jsii.String("questionHandlerQueue"), &sqs.QueueProps{})
	purchaseHandlerQueue := sqs.NewQueue(stack, jsii.String("purchaseHandlerQueue"), &sqs.QueueProps{})
	externalApiHealthMonitoringHandlerDLQ := sqs.NewQueue(
		stack,
		jsii.String("externalApiHealthMonitoringHandlerDLQ"),
		&sqs.QueueProps{
			DeliveryDelay: cdk.Duration_Seconds(jsii.Number(15)), // Change to 15 minutes in prod.
		},
	)
	externalApiHealthMonitoringQueue := sqs.NewQueue(
		stack,
		jsii.String("externalApiHealthMonitoringQueue"),
		&sqs.QueueProps{
			DeadLetterQueue: &sqs.DeadLetterQueue{
				Queue:           externalApiHealthMonitoringHandlerDLQ,
				MaxReceiveCount: jsii.Number(5),
			},
		},
	)

	lambdanodejs.NewNodejsFunction(
		stack,
		jsii.String("createRequestFn"),
		&lambdanodejs.NodejsFunctionProps{
			Handler: jsii.String("handler"),
			Entry:   jsii.String("./src/lambdas/internal/create-request.ts"),
			Environment: &map[string]*string{
				"BUCKET_NAME":                bucket.BucketName(),
				"REQUEST_CREATION_QUEUE_URL": requestRedirectionQueue.QueueUrl(),
				"QUESTION_HANDLER_QUEUE_URL": questionHandlerQueue.QueueUrl(),
				"PURCHASE_HANDLER_QUEUE_URL": purchaseHandlerQueue.QueueUrl(),
			},
		},
	)

	monitorExternalApiHealthFn := lambdanodejs.NewNodejsFunction(
		stack,
		jsii.String("monitorExternalApiHealthFn"),
		&lambdanodejs.NodejsFunctionProps{
			Handler: jsii.String("handler"),
			Entry:   jsii.String("./src/lambdas/internal/monitor-external-api-health.ts"),
			Environment: &map[string]*string{
				"MONITOR_HEALTH_FN_URL": cdk.Fn_ImportValue(jsii.String("monitorHealthFnUrl")),
			},
		},
	)

	monitorExternalApiHealthFn.AddEventSource(
		lambdaeventsources.NewSqsEventSource(
			externalApiHealthMonitoringQueue,
			&lambdaeventsources.SqsEventSourceProps{
				ReportBatchItemFailures: jsii.Bool(true),
			}),
	)

	retryMonitorExternalApiHealthFn := lambdanodejs.NewNodejsFunction(
		stack,
		jsii.String("retryMonitorExternalApiHealthFn"),
		&lambdanodejs.NodejsFunctionProps{
			Handler: jsii.String("handler"),
			Entry:   jsii.String("./src/lambdas/internal/retry-monitor-external-api-health.ts"),
			Environment: &map[string]*string{
				"MONITOR_HEALTH_FN_URL": cdk.Fn_ImportValue(jsii.String("monitorHealthFnUrl")),
			},
			Timeout: cdk.Duration_Seconds(jsii.Number(5)),
		},
	)

	retryMonitorExternalApiHealthFn.AddEventSource(
		lambdaeventsources.NewSqsEventSource(
			externalApiHealthMonitoringHandlerDLQ,
			&lambdaeventsources.SqsEventSourceProps{
				ReportBatchItemFailures: jsii.Bool(true),
			}),
	)

	redirectRequestFn := lambdanodejs.NewNodejsFunction(
		stack,
		jsii.String("redirectRequestFn"),
		&lambdanodejs.NodejsFunctionProps{
			Handler: jsii.String("handler"),
			Entry:   jsii.String("./src/lambdas/internal/redirect-request.ts"),
			Environment: &map[string]*string{
				"BUCKET_NAME":        bucket.BucketName(),
				"GET_PRODUCT_FN_URL": cdk.Fn_ImportValue(jsii.String("getProductFnUrl")),
			},
		},
	)

	redirectRequestFn.AddEventSource(
		lambdaeventsources.NewSqsEventSource(
			requestRedirectionQueue,
			&lambdaeventsources.SqsEventSourceProps{
				ReportBatchItemFailures: jsii.Bool(true),
			}),
	)

	handleQuestionFn := lambdanodejs.NewNodejsFunction(
		stack,
		jsii.String("handleQuestionFn"),
		&lambdanodejs.NodejsFunctionProps{
			Handler: jsii.String("handler"),
			Entry:   jsii.String("./src/lambdas/internal/handle-question.ts"),
		},
	)

	handleQuestionFn.AddEventSource(
		lambdaeventsources.NewSqsEventSource(
			questionHandlerQueue,
			&lambdaeventsources.SqsEventSourceProps{
				ReportBatchItemFailures: jsii.Bool(true),
			}),
	)

	handlePurchaseFn := lambdanodejs.NewNodejsFunction(
		stack,
		jsii.String("handlePurchaseFn"),
		&lambdanodejs.NodejsFunctionProps{
			Handler: jsii.String("handler"),
			Entry:   jsii.String("./src/lambdas/internal/handle-purchase.ts"),
		},
	)

	handlePurchaseFn.AddEventSource(
		lambdaeventsources.NewSqsEventSource(
			purchaseHandlerQueue,
			&lambdaeventsources.SqsEventSourceProps{
				ReportBatchItemFailures: jsii.Bool(true),
			}),
	)

	return stack
}

func main() {
	defer jsii.Close()

	app := cdk.NewApp(nil)

	NewInternalStack(app, "InternalStack", &InternalStackProps{
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
