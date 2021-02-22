const gitCommands = {
    commands: [
        {
            name: 'add',
            description: 'Adds %s to the staging area, ready to be committed.',
            flags: [
                {
                    name: 'verbose',
                    aliases: ['v'],
                    description: 'Be verbose (allows the command to say more about what it does).',
                    isString: false,
                },
                {
                    name: 'dry-run',
                    aliases: ['n'],
                    description: 'Don’t actually add the file(s), just show if they exist.',
                    isString: false,
                },
                {
                    name: 'force',
                    aliases: ['f'],
                    description: 'Allow adding ignored files.',
                    isString: false,
                },
                {
                    name: 'pathspec-from-file',
                    description:
                        'Adds the files to the staging area from %s instead of command-line arguments (separated by line breaks). If the value of the flag is -, then standard input is used instead.',
                    isString: true,
                },
            ],
        },
        {
            name: 'commit',
            description: 'Saves changes added to the staging area to the local git repository.',
            flags: [
                {
                    name: 'all',
                    aliases: ['a'],
                    description:
                        'Automatically adds every file that has been changed or deleted to the commit, but not the files that you just created.',
                    isString: false,
                },
                {
                    name: 'message',
                    aliases: ['m'],
                    description: 'Set the commit message to %s',
                    isString: true,
                },
            ],
        },
        {
            name: 'push',
            description: 'Updates your remote branch with your local commits.',
            flags: [
                {
                    name: 'all',
                    description: 'Push all branches.',
                    isString: false,
                },
                {
                    name: 'prune',
                    description:
                        'Remove remote branches that don’t have a local counterpart. For example, a branch foo will be removed if a local branch with the same name does not exist anymore.',
                    isString: false,
                },
                {
                    name: 'dry-run',
                    aliases: ['n'],
                    description: 'Do everything except send the updates (effectively simulating a push).',
                    isString: false,
                },
                {
                    name: 'porcelain',
                    description:
                        'Outputs machine-readable and parsable output (The output status line for each ref will be tab-separated and sent to stdout instead of stderr).',
                    isString: false,
                },
            ],
        },
    ],
}

const specialTokens = {
    '.': 'all files in the current directory',
    '..': 'all files in the previous directory',
}

export { gitCommands, specialTokens }
