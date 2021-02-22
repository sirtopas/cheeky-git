import parser from 'yargs-parser'
import '../styles/app.css'
import { useState } from 'react'
import React from "react"
import { gitCommands, specialTokens } from '../data/git-commands';
import {
    getAvailableFlagsAsArray,
    getMatchingFlags,
    getParsedFlagsDescriptions,
    getAliasesAsObject,
    replaceSpecialTokens,
} from '../utils/git-command-parsing';
import { joinWithFinalAnd } from '../utils/utils';
import { AvailableFlagsArray, GitCommand, InputFlag } from '../model/models'
import axios from 'axios';
import cheerio from 'cheerio';

// Gets the matching git command from the git-commands.js file, and formats the description using the arguments if needed.
function getGitCommand(inputCommand: string): GitCommand | null {
    // Get the command name and check if it exists
    const inputCommandName = inputCommand.split(' ')[1]
    const matchingCommand = gitCommands.commands.find((command) => command.name === inputCommandName)
    if (!(inputCommand.split(' ')[0] === 'git') || !matchingCommand) {
        return null;
    }

    // Get all the available flags
    const availableFlags = gitCommands.commands.find((command) => command.name === inputCommandName)?.flags

    // These arrays exist so they can be used with yargs-parser
    let availableFlagsAsArrays: AvailableFlagsArray
    let aliasesObject: any

    if (availableFlags) {
        availableFlagsAsArrays = getAvailableFlagsAsArray(availableFlags)
        aliasesObject = getAliasesAsObject(availableFlags)
    }

    // Parse the arguments
    const parsedArgs = parser(inputCommand, {
        boolean: availableFlagsAsArrays?.booleanFlagsArray,
        string: availableFlagsAsArrays?.stringFlagsArray,
        alias: aliasesObject,
    })

    // Restructure the arguments to be easier to work with
    // Instead of the flags being as keys value pairs in the object, put them in their own property called flags with a name and a value
    const parsedArguments = Object.entries(parsedArgs).reduce(
        (acc, [argumentKey, argumentValue]) => {
            if (argumentKey === '_') {
                return { ...acc, _: argumentValue }
            }
            if (argumentValue) {
                acc.flags.push({ name: argumentKey, value: argumentValue })
            }
            return acc
        },
        { _: [] as string[], flags: [] as InputFlag[] }
    )

    let matchingFlags: any
    if (availableFlags) {
        matchingFlags = getMatchingFlags(availableFlags, parsedArguments)
    }

    // Check if the arguments contain special tokens and replace them by the description to be displayed in the description
    const updatedParsedArguments = replaceSpecialTokens(parsedArguments, specialTokens)

    // Replace string tokens with arguments and add a list of flags descriptions if needed
    const updatedMatchingCommand = {
        ...matchingCommand,
        description: matchingCommand.description.replace(
            '%s',
            joinWithFinalAnd(updatedParsedArguments._)
        ),
        flagsDescriptions: getParsedFlagsDescriptions(matchingFlags || [], parsedArguments),
    }
    getGitCommandFromWeb();

    return updatedMatchingCommand
}

function renderCommandDescription(command: GitCommand) {
    let flagsDescriptions
    if (command.flagsDescriptions) {
        flagsDescriptions = command.flagsDescriptions.map((flag) => {
            return (
                <div>
                    <h3>
                        --{flag.name}
                        {flag.aliases ? ` (${flag.aliases.map((alias) => `-${alias}`).join(' / ')})` : ''}
                    </h3>
                    <p>{flag.description}</p>
                </div>
            )
        })
    }

    return (
        <div>
            <h3>git {command.name}</h3>
            <p>{command.description}</p>
            {flagsDescriptions && <h2>Flags</h2>}
            {flagsDescriptions && flagsDescriptions}
        </div>
    )
}

function getGitCommandFromWeb() {
    const url = 'https://thingproxy.freeboard.io/fetch/https://git-scm.com/docs/git-commit/'; // URL we're scraping
    const AxiosInstance = axios.create(); // Create a new Axios Instance

    // Send an async HTTP Get request to the url
    AxiosInstance.get(url)
        .then( // Once we have data returned ...
            response => {
                const html = response.data; // Get the HTML from the HTTP request
                const $ = cheerio.load(html); // Load the HTML string into cheerio
                // $("#monsters-list li span").each(function (i, element) {
                //     let name = $(this)
                //         .prepend()
                //         .text();
                //     names.push(name);
                // });
                const template = document.createElement('html');
                template.innerHTML = html;
                const doc = template.querySelector("#documentation");
                const main = doc.querySelector('#main');
                const sections = main.querySelectorAll('.sect1');
                let options = template.querySelector("#_options");
                //    console.log(options);
                options = options.nextElementSibling;
                options = options.querySelector("dl");

                let buffer = [];
                //    console.log('options parent');
                //    console.log(options);
                const flags = [];
                for (let child of options.children) {
                    let flag = {};
                    //        console.log(child);
                    if (child.tagName == 'DT') {
                        buffer.push(child);
                    }
                    console.log(child.tagName);
                    if (child.tagName != 'DD') continue;
                    let longest = '';
                    let aliases = [];
                    for (let dt of buffer) {
                        let option = dt.innerText.trim();
                        //            console.log(option);
                        if (option.length > longest.length) longest = option;
                        aliases.push(option);
                    }


                    aliases.splice(aliases.indexOf(longest), 1);

                    flag.name = longest;
                    flag.aliases = aliases;
                    flag.description = child.innerText.trim();
                    flag.isString = false;
                    if (flag.name.includes('<') && flag.name.includes('>')) flag.isString = true;
                    else { flag.name = flag.name.substring(2); }

                    //        console.log({aliases:aliases, shortest:shortest})

                    flags.push(flag);
                    buffer = [];
                }
                console.log(flags);

                // console.log($('.dlist')[0]); // Log the number of captured elements
            }
        )
        .catch(console.error); // Error handling
}

function App() {
    const [matchingCommand, setMatchingCommand] = useState({} as GitCommand)
    const [inputCommand, setInputCommand] = useState('')
    const [isInvalid, setIsInvalid] = useState(false)

    const handleGetCommandClick = (inputCommand: string) => {
        const gitCommand = getGitCommand(inputCommand.toLowerCase())
        if (!gitCommand) {
            setIsInvalid(true)
            setMatchingCommand({} as GitCommand)
        } else {
            setIsInvalid(false)
            setMatchingCommand(gitCommand)
        }
    }

    return (
        <div className='App'>
            <div className='App-container'>
                <header className='App-header'>
                    <h1>
                        &gt;cheeky <span className='git'>git</span>
                    </h1>
                    <h2>enter a git command and have it explained to you</h2>
                </header>
                <div className='get-command-section'>
                    <input
                        type='text'
                        className='input-command'
                        placeholder='git commit -m "Add example command"'
                        autoComplete='off'
                        autoCapitalize='off'
                        onChange={(e) => setInputCommand(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.code === 'Enter') {
                                handleGetCommandClick(inputCommand)
                            }
                        }}
                    />
                    <button
                        className='get-command-button'
                        onClick={() => handleGetCommandClick(inputCommand)}
                    >
                        git it
          </button>
                    {isInvalid && (
                        <h2 className='invalid-command-error'>error: the command is not a valid git command</h2>
                    )}
                    {Object.entries(matchingCommand).length > 0 && renderCommandDescription(matchingCommand)}
                </div>
            </div>
        </div>
    )
}

export default App

