# Third-party components

## jslm

A copy of a small
[library](https://github.com/google-research/google-research/tree/master/jslm)
of dynamic language models in JavaScript by Google.  The copy contains a subset
of the classes required to implement the Prediction by Partial Matching (PPM)
language model.

## mozolm
A language model serving library by Google, with middleware functionality
including mixing of probabilities from disparate base language model types and tokenizations along with RPC client/server interactions.
[Github](https://github.com/google-research/google-research/mozolm)

This concept for integration is based off the sample code found in the gRPC-web
[repo](https://github.com/grpc/grpc-web).

### Pre-Req
#### Docker
[Docker](https://www.docker.com)

1. Install packages needed by the grpc-web
```
$ npm install
```
2. Start the envoy engine & mozolm server
Expect training file at: ~/training.txt
See ./run.sh for more details
```
$ npm start
```
