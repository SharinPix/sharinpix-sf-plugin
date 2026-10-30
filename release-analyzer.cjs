// Every push to main is a minor release, or a major one if a commit message contains [major].
module.exports = {
  analyzeCommits: (_, { commits }) => {
    if (!commits.length) return null;
    return commits.some((commit) => /\[major\]/i.test(commit.message)) ? 'major' : 'minor';
  },
};
