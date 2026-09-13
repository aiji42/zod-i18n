/**
 * @type {import('semantic-release').Options}
 */
module.exports = {
    extends: 'semantic-release-monorepo',
    branches: ['main', { name: 'beta', prerelease: true }],
    plugins: [
        '@semantic-release/commit-analyzer',
        '@semantic-release/release-notes-generator',
        [
            '@semantic-release/exec',
            {
                // 1. Force pnpm to bump the package.json version
                prepareCmd: 'pnpm version ${nextRelease.version} --no-git-tag-version',
                // 2. Force pnpm to publish to the registry
                publishCmd: 'pnpm publish --no-git-checks --access public',
            },
        ],
        '@semantic-release/github',
    ],
};