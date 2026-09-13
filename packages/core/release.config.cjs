module.exports = {
    extends: 'semantic-release-monorepo',
    branches: [
        'main',
        {
            name: 'beta',
            prerelease: true,
        },
    ],
    plugins: [
        '@semantic-release/commit-analyzer',
        '@semantic-release/release-notes-generator',
        [
            '@semantic-release/exec',
            {
                prepareCmd: 'pnpm pkg set version=${nextRelease.version}',
                publishCmd: 'pnpm publish --no-git-checks --access public',
            },
        ],
        '@semantic-release/github',
    ],
};