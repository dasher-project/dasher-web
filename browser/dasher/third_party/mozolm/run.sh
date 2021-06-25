#Launch docker/Envoy
echo '** Launching Envoy Proxy  **'
docker run -d -v "$(pwd)"/envoy.yaml:/etc/envoy/envoy.yaml:ro -p 8080:8080 -p 9901:9901 envoyproxy/envoy:v1.17.0

#Launch docker/MozoLM
echo '** Launching MozoLM Service  **'
echo 'Expect training file at: ~/training.txt'
docker run -d --init -v ~/:/data -p 9090:9090 gcr.io/mozolm-release/server_async \
   --server_config="address_uri:\"0.0.0.0:9090\" model_hub_config { model_config { \
     type:PPM_AS_FST storage { model_file:\"/data/training.txt\" ppm_options { \
     max_order: 4 static_model: false } } } }"
