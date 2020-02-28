//
//  ViewController.swift
//
// (c) 2020 The ACE Centre-North, UK registered charity 1089313.
// MIT licensed, see https://opensource.org/licenses/MIT
//

import UIKit

import CaptiveWebView

class MainViewController: CaptiveWebView.DefaultViewController {

    override func response(
        to command: String,
        in commandDictionary: Dictionary<String, Any>
    ) throws -> Dictionary<String, Any>
    {
        switch command {
        case Commands.Ready.name:
            Predictor.tests()
            return [
                // Return a single-element array.
                Commands.Ready.Ret.predictorCommands: [Commands.Predict.name]
            ]
            
        case Predictor.Command.name:
            // Uncomment the following to force an error.
            // var duffDictionary = commandDictionary
            // duffDictionary.removeValue(forKey: Predictor.Command.Args.input)
            // return try Predictor.handlePredictCommand(args: duffDictionary)
            return try Predictor.response(to: commandDictionary)
            
        default:
            return try super.response(to: command, in: commandDictionary)
        }
    }
    
}
