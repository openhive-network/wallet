module.exports = {
    up(queryInterface) {
        queryInterface.removeIndex('accounts', ['name']);
        return queryInterface.addIndex('accounts', ['name']);
    },

    down() {},
};
