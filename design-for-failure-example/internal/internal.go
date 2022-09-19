package main

import (
	"os"

	cdk "github.com/aws/aws-cdk-go/awscdk/v2"
	lambda "github.com/aws/aws-cdk-go/awscdk/v2/awslambda"
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

	obtaitingProductDLQ := sqs.NewQueue(
		stack,
		jsii.String("obtaitingProductDLQ"),
		&sqs.QueueProps{
			// In a real scenario use more time.
			// And consider minutes instead of seconds.
			DeliveryDelay: cdk.Duration_Seconds(jsii.Number(5)),
		},
	)
	obtaitingProductQueue := sqs.NewQueue(stack, jsii.String("obtaitingProductQueue"), &sqs.QueueProps{
		DeadLetterQueue: &sqs.DeadLetterQueue{
			MaxReceiveCount: jsii.Number(1),
			Queue:           obtaitingProductDLQ,
		},
	})
	requestRedirectionQueue := sqs.NewQueue(stack, jsii.String("requestRedirectionQueue"), &sqs.QueueProps{})
	purchaseHandlerQueue := sqs.NewQueue(stack, jsii.String("purchaseHandlerQueue"), &sqs.QueueProps{})
	questionHandlerQueue := sqs.NewQueue(stack, jsii.String("questionHandlerQueue"), &sqs.QueueProps{})
	purchaseOfflineHandlerQueue := sqs.NewQueue(stack, jsii.String("purchaseOfflineHandlerQueue"), &sqs.QueueProps{})
	questionOfflineHandlerQueue := sqs.NewQueue(stack, jsii.String("questionOfflineHandlerQueue"), &sqs.QueueProps{})

	lambdanodejs.NewNodejsFunction(
		stack,
		jsii.String("createRequestFn"),
		&lambdanodejs.NodejsFunctionProps{
			Handler: jsii.String("handler"),
			Entry:   jsii.String("./src/lambdas/create-request.ts"),
			Runtime: lambda.Runtime_NODEJS_16_X(),
			Environment: &map[string]*string{
				"BUCKET_NAME":                 bucket.BucketName(),
				"OBTAINING_PRODUCT_QUEUE_URL": obtaitingProductQueue.QueueUrl(),
			},
		},
	)

	getProductFn := lambdanodejs.NewNodejsFunction(
		stack,
		jsii.String("getProductFn"),
		&lambdanodejs.NodejsFunctionProps{
			Handler: jsii.String("handler"),
			Entry:   jsii.String("./src/lambdas/get-product.ts"),
			Runtime: lambda.Runtime_NODEJS_16_X(),
			Environment: &map[string]*string{
				"GET_PRODUCT_FN_URL":            cdk.Fn_ImportValue(jsii.String("getProductFnUrl")),
				"REQUEST_REDIRECTION_QUEUE_URL": requestRedirectionQueue.QueueUrl(),
			},
		},
	)
	getProductFn.AddEventSource(
		lambdaeventsources.NewSqsEventSource(
			obtaitingProductQueue,
			&lambdaeventsources.SqsEventSourceProps{
				ReportBatchItemFailures: jsii.Bool(true),
			}),
	)
	getProductOfflineFn := lambdanodejs.NewNodejsFunction(
		stack,
		jsii.String("getProductOfflineFn"),
		&lambdanodejs.NodejsFunctionProps{
			Handler: jsii.String("handler"),
			Entry:   jsii.String("./src/lambdas/offline/get-product.ts"),
			Runtime: lambda.Runtime_NODEJS_16_X(),
			Environment: &map[string]*string{
				"GET_PRODUCT_FN_URL":            cdk.Fn_ImportValue(jsii.String("getProductFnUrl")),
				"REQUEST_REDIRECTION_QUEUE_URL": requestRedirectionQueue.QueueUrl(),
			},
		},
	)
	getProductOfflineFn.AddEventSource(
		lambdaeventsources.NewSqsEventSource(
			obtaitingProductDLQ,
			&lambdaeventsources.SqsEventSourceProps{
				ReportBatchItemFailures: jsii.Bool(true),
			}),
	)

	redirectRequestFn := lambdanodejs.NewNodejsFunction(
		stack,
		jsii.String("redirectRequestFn"),
		&lambdanodejs.NodejsFunctionProps{
			Handler: jsii.String("handler"),
			Entry:   jsii.String("./src/lambdas/redirect-request.ts"),
			Runtime: lambda.Runtime_NODEJS_16_X(),
			Environment: &map[string]*string{
				"BUCKET_NAME":                       bucket.BucketName(),
				"HANDLE_PURCHASE_QUEUE_URL":         purchaseHandlerQueue.QueueUrl(),
				"HANDLE_QUESTION_QUEUE_URL":         questionHandlerQueue.QueueUrl(),
				"HANDLE_OFFLINE_PURCHASE_QUEUE_URL": purchaseOfflineHandlerQueue.QueueUrl(),
				"HANDLE_OFFLINE_QUESTION_QUEUE_URL": questionOfflineHandlerQueue.QueueUrl(),
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

	handlePurchaseFn := lambdanodejs.NewNodejsFunction(
		stack,
		jsii.String("handlePurchaseFn"),
		&lambdanodejs.NodejsFunctionProps{
			Handler: jsii.String("handler"),
			Entry:   jsii.String("./src/lambdas/handle-purchase.ts"),
			Runtime: lambda.Runtime_NODEJS_16_X(),
		},
	)
	handlePurchaseFn.AddEventSource(
		lambdaeventsources.NewSqsEventSource(
			purchaseHandlerQueue,
			&lambdaeventsources.SqsEventSourceProps{
				ReportBatchItemFailures: jsii.Bool(true),
			}),
	)

	handleQuestionFn := lambdanodejs.NewNodejsFunction(
		stack,
		jsii.String("handleQuestionFn"),
		&lambdanodejs.NodejsFunctionProps{
			Handler: jsii.String("handler"),
			Entry:   jsii.String("./src/lambdas/handle-question.ts"),
			Runtime: lambda.Runtime_NODEJS_16_X(),
		},
	)
	handleQuestionFn.AddEventSource(
		lambdaeventsources.NewSqsEventSource(
			questionHandlerQueue,
			&lambdaeventsources.SqsEventSourceProps{
				ReportBatchItemFailures: jsii.Bool(true),
			}),
	)

	handleOfflinePurchaseFn := lambdanodejs.NewNodejsFunction(
		stack,
		jsii.String("handleOfflinePurchaseFn"),
		&lambdanodejs.NodejsFunctionProps{
			Handler: jsii.String("handler"),
			Entry:   jsii.String("./src/lambdas/offline/handle-purchase.ts"),
			Runtime: lambda.Runtime_NODEJS_16_X(),
		},
	)
	handleOfflinePurchaseFn.AddEventSource(
		lambdaeventsources.NewSqsEventSource(
			purchaseOfflineHandlerQueue,
			&lambdaeventsources.SqsEventSourceProps{
				BatchSize:               jsii.Number(10),
				ReportBatchItemFailures: jsii.Bool(true),
			}),
	)

	handleOfflineQuestionFn := lambdanodejs.NewNodejsFunction(
		stack,
		jsii.String("handleOfflineQuestionFn"),
		&lambdanodejs.NodejsFunctionProps{
			Handler: jsii.String("handler"),
			Entry:   jsii.String("./src/lambdas/offline/handle-question.ts"),
			Runtime: lambda.Runtime_NODEJS_16_X(),
		},
	)
	handleOfflineQuestionFn.AddEventSource(
		lambdaeventsources.NewSqsEventSource(
			questionOfflineHandlerQueue,
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
