module.exports = {
    random: (limit) => {
        let number = Math.floor(limit * Math.random())
        return number >= limit ? 0 : number;
    }
}