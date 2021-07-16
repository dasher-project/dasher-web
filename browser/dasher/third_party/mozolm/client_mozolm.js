// Copyright 2021 Anonymous Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const { LMScores, GetContextRequest, NextState,
       UpdateLMScoresRequest, MozoLMServiceClient } = require('@copewithjeremy/mozolm-grpc-web');

window.prob_dict = {};
window.prob_vector = [];

window.mozolm = function(context){ return new Promise(function(resolve, reject) {
  // If hostname isn't populated we're running from the electron app
  const hostname = window.location.hostname || "localhost"
  var client = new MozoLMServiceClient(`http://${hostname}:8080`, null, null);

  // simple unary call
  var request = new GetContextRequest();
  request.setContext(context);
  request.setState(-1);

  client.getLMScores(request, {}, (err, response) => {
    if (err) {
      console.log(`Unexpected error for GetLMScores: code = ${err.code}` +
                  `, message = "${err.message}"`);
    } else {
      var symbols = response.getSymbolsList();
      var probabilities = response.getProbabilitiesList();

      //Make pair, then sort on probability, then reverse
      prob_vector = [];
      var prob_size = symbols.length;
      for (i = 0; i < prob_size; i++) {
        prob_vector.push({s:symbols[i],
                          p:probabilities[i]});
        prob_dict[symbols[i].codePointAt(0)] = probabilities[i];
      }
      prob_vector.sort((a, b) => a.p - b.p);
      prob_vector.reverse();

      resolve(prob_dict);
      //resolve(prob_vector);
    }
  });
});}
