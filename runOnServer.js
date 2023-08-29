module.exports = function () {
    const datas = {};
    let today = new Date();
    let tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    let startDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());

    while (startDate <= tomorrow) {
        let formattedDate = startDate.toISOString().slice(0,10);
        const counts = api.sql.getColumn(`SELECT COUNT(*) AS data_count FROM notes WHERE utcDateModified LIKE '%${formattedDate}%'; `);

        if (counts != 0){
            datas[formattedDate] = counts[0];
        }
        startDate.setDate(startDate.getDate() + 1);
    }

    let str = JSON.stringify(datas);
    let codeContent = "module.exports = function () {var arr=" + str + ";return arr}";
    const note = api.getNoteWithLabel("heatmapDatas");
    note.setContent(codeContent);
}