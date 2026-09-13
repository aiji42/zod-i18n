/**
 * @type {import('semantic-release').Options}
 */
module.exports = {
    repositoryUrl: 'git@github.com:VC-Semih/zod-i18n.git',
    branches: ['main'],
    plugins: [
        '@semantic-release/commit-analyzer',
        '@semantic-release/release-notes-generator',
        [
            '@semantic-release/npm',
            {
                pkgRoot: '.',
            },
        ],
        '@semantic-release/github',
    ],
};