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

// func hello() {
// 	var w *zip.Writer

// 	f, err := os.Create("")
// 	if err != nil {
// 		log.Fatal(err)
// 	}

// 	// The new zip file.
// 	w = zip.NewWriter(f)

// 	//
// 	for _, filename := range args {
// 		rc, err := zip.OpenReader(filename)
// 		if err != nil {
// 			log.Print(err)
// 			continue
// 		}
// 		for _, file := range rc.File {
// 			if err := w.Copy(file); err != nil {
// 				log.Printf("copying from %s (%s): %v", filename, file.Name, err)
// 			}
// 		}
// 	}

// 	if err := w.Close(); err != nil {
// 		log.Fatal("finishing zip file: %v", err)
// 	}
// 	if err := f.Close(); err != nil {
// 		log.Fatal("finishing zip file: %v", err)
// 	}
// }

type Body struct {
	Prefix string `json:"prefix"`
}

func handler(ctx context.Context, sqsEvent events.SQSEvent) error {
	cfg, err := config.LoadDefaultConfig(context.TODO())
	if err != nil {
		log.Fatalf("unable to load SDK config, %v", err)
	}

	s3Client := s3.NewFromConfig(cfg)

	for _, message := range sqsEvent.Records {
		var body Body
		json.Unmarshal([]byte(message.Body), &body)

		listObjectsOutput, err := s3Client.ListObjectsV2(context.TODO(), &s3.ListObjectsV2Input{
			Bucket: aws.String(os.Getenv("BUCKET_NAME")),
			Prefix: aws.String(body.Prefix),
		})
		if err != nil {
			log.Fatalf("error listing objects, %v", err)
		}

		// downloader := manager.NewDownloader(s3Client)

		for _, item := range listObjectsOutput.Contents {
			// numBytes, err := downloader.Download(context.TODO(), downloadFile, &s3.GetObjectInput{
			// 	Bucket: aws.String("my-bucket"),
			// 	Key:    aws.String(*item.Key),
			// })
			getObjectOutput, err := s3Client.GetObject(context.TODO(), &s3.GetObjectInput{
				Bucket: aws.String(os.Getenv("BUCKET_NAME")),
				Key:    aws.String(*item.Key),
			})
			if err != nil {
				log.Fatalf("error getting single object, %v", err)
			}
			defer getObjectOutput.Body.Close()

			// getObjectOutput.Body.Read()
			// Continue here.
		}

	}
	return nil
}

func main() {
	lambda.Start(handler)
}
