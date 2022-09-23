package main

import (
	"context"
	"encoding/json"
	"log"
	"os"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

type Body struct {
	Prefix string `json:"prefix"`
}

func handler(ctx context.Context, sqsEvent events.SQSEvent) error {
	cfg, err := config.LoadDefaultConfig(context.TODO())
	if err != nil {
		log.Fatalf("unable to load SDK config, %v", err)
	}

	svc := s3.NewFromConfig(cfg)

	for _, message := range sqsEvent.Records {
		var body Body
		json.Unmarshal([]byte(message.Body), &body)

		listObjectsOutput, err := svc.ListObjectsV2(context.TODO(), &s3.ListObjectsV2Input{
			Bucket: aws.String(os.Getenv("BUCKET_NAME")),
			Prefix: aws.String(body.Prefix),
		})
		if err != nil {
			log.Fatalf("error listing objects, %v", err)
		}

		for _, item := range listObjectsOutput.Contents {
			getObjectOutput, err := svc.GetObject(context.TODO(), &s3.GetObjectInput{
				Bucket: aws.String(os.Getenv("BUCKET_NAME")),
				Key:    aws.String(*item.Key),
			})
			if err != nil {
				log.Fatalf("error getting single object, %v", err)
			}

			defer getObjectOutput.Body.Close()
		}

	}
	return nil
}

func main() {
	lambda.Start(handler)
}
