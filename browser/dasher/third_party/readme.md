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

*.proto files are copied over from the mozolm libary, with include paths updated

This concept for integration is based off the sample code found in the gRPC-web
[repo](https://github.com/grpc/grpc-web).

### Pre-Req
#### Protoc
[Protocol Buffers](https://developers.google.com/protocol-buffers/).
Install both `protoc` and `protoc-gen-grpc-web`
#### Docker
[Docker](https://www.docker.com).
#### MozoLM-Server
[mozolm Server Binaries](https://github.com/google-research/mozolm).

1. Create .js files frome the proto files
```
$ protoc -I=. lm_scores.proto --js_out=import_style=commonjs:. --grpc-web_out=import_style=commonjs,mode=grpcwebtext:.
$ protoc -I=. service.proto --js_out=import_style=commonjs:. --grpc-web_out=import_style=commonjs,mode=grpcwebtext:.
```
2. Install packages needed by the grpc-web

```
$ npm install
```
3. Package the mozolm client into a single file,
to be imported by dasher in index.hml
```
$ npx webpack client_mozolm.js
```
4. Start the docker engine
```
$ docker run -d -v "$(pwd)"/envoy.yaml:/etc/envoy/envoy.yaml:ro -p 8080:8080 -p 9901:9901 envoyproxy/envoy:v1.17.0
```
5. Start the mozolm server
```
$ export DATADIR=mozolm/data
$ export VOCAB="${DATADIR}"/en_wiki_1Mline_char_bigram.rows.txt
$ export COUNTS="${DATADIR}"/en_wiki_1Mline_char_bigram.matrix.txt
$ bazel-bin/mozolm/grpc/mozolm_server_async \
    --client_server_config="server_port:\"localhost:9090\" \
    credential_type:INSECURE server_config { model_hub_config { \
    model_config { type:SIMPLE_CHAR_BIGRAM storage { \
    vocabulary_file:\"$VOCAB\"  model_file:\"$COUNTS\" } } } \
    wait_for_clients:true }"
```
