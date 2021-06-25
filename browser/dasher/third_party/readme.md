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
2. Start the envoy engine
```
$ docker run -d -v "$(pwd)"/envoy.yaml:/etc/envoy/envoy.yaml:ro -p 8080:8080 -p 9901:9901 envoyproxy/envoy:v1.17.0
```
5. Start the mozolm server
Expect training file at: ~/training.txt
```
docker run -d --init -v ~/:/data -p 9090:9090 gcr.io/mozolm-release/server_async \
   --server_config="address_uri:\"0.0.0.0:9090\" model_hub_config { model_config { \
     type:PPM_AS_FST storage { model_file:\"/data/training.txt\" ppm_options { \
     max_order: 4 static_model: false } } } }"
```
