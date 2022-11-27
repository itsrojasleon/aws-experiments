package main

import (
	"context"
	"os"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

func errorResponse(err error) events.APIGatewayProxyResponse {
	return events.APIGatewayProxyResponse{
		Body:       "Something went wrong",
		StatusCode: 500,
	}
}

func HandleRequest() events.APIGatewayProxyResponse {
	cfg, err := config.LoadDefaultConfig(context.TODO())
	if err != nil {
		return errorResponse(err)
	}

	s3Client := s3.NewFromConfig(cfg)

	objectOutput, err := s3Client.GetObject(context.TODO(), &s3.GetObjectInput{
		Bucket: aws.String(os.Getenv("BUCKET_NAME")),
		Key:    aws.String("file.txt"),
	})

	if err != nil {
		return errorResponse(err)
	}
	defer objectOutput.Body.Close()

	return events.APIGatewayProxyResponse{
		Body:       "File uploaded successfully",
		StatusCode: 200,
	}
}

func main() {
	lambda.Start(HandleRequest)
}
