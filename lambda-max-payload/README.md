# Lambda max payload

Lambda will not handle a `massive` incoming post request since the maximum [invocation payload is 6 MB](https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-limits.html)

## Run the example

The api url might be down, keep that in mind.

```js
cd src/scripts && node call.js
```

I need to look for other solution.
