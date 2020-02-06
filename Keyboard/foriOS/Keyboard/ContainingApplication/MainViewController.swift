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
            return [:]
        case Commands.Predict.name:
            return predict(args: commandDictionary)
        default:
            return try super.response(to: command, in: commandDictionary)
        }
    }
    
    /// Handle the 'predict' command.
    /// - Parameter args: Command arguments.
    func predict(args: Dictionary<String, Any>) -> Dictionary<String, Any> {
        guard let input = args[Commands.Predict.Args.input] as? String else {
            return [:]
        }
        
        if input.count > 0, let predictions = Predictor.predictions(for: input) {
            return [Commands.Predict.Ret.predictions: predictions]
        }
        
        return [:]
    }
}

