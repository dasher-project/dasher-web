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
        case Commands.Predict.name:
            // Uncomment the following to force an error.
            // var duffDictionary = commandDictionary
            // duffDictionary.removeValue(forKey: Commands.Predict.Args.input)
            // return try predict(args: duffDictionary)
            return try predict(args: commandDictionary)
        default:
            return try super.response(to: command, in: commandDictionary)
        }
    }
    
    /// Handle the 'predict' command.
    /// - Parameter args: Command arguments.
    func predict(
        args: Dictionary<String, Any>
    ) throws -> Dictionary<String, Any>
    {
        guard let input = args[Commands.Predict.Args.input] as? String else {
            throw ErrorMessage.message("Missing `input` parameter in \(args).")
        }
        
        let result = Predictor.completeLastWord(of: input)
        return [
            "replacements": result.replacements ?? [],
            "replacedLength": result.replacedLength
        ]
    }
}

// See note in DefaultViewController.swift file, in the Captive Web View project
// for a discussion of why this is here.
private enum ErrorMessage: Error {
    case message(_ message:String)
}
