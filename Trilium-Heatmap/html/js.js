const weeks = ['Mon', 'Wed', 'Fri', 'Sun']; //fill in the month word names that are suitable for your native language.
const colorRange = ["#FC9", "#fd5409"]; //fill in the range of colors you like.
const dataRange = [1, 40]; //fill in the number of note modifications that are suitable for you.
const offsetX = 20; //Adjust the offset of the tooltip according to your needs.
const offsetY = 40; //Adjust the offset of the tooltip according to your needs.

function generateDataset(displayedMonthCount, options = {}) {
    const config = Object.assign({}, {
        endDate: null,
        fill: {},
    }, options);
    const months = [];
    let days = [];

    let referDate = config.endDate ? new Date(config.endDate) : new Date();
    referDate.setDate(1); 

    for (let i = 0; i < displayedMonthCount; i++) {
        let currentMonth = new Date(referDate.getFullYear(), referDate.getMonth() - i, 1);
        let nextMonth = new Date(referDate.getFullYear(), referDate.getMonth() - i + 1, 1);

        let month = (currentMonth.getMonth() + 1).toString().padStart(2, '0');
        months.unshift(currentMonth.getFullYear() + '-' + month);

        const monthDays = [];
        while (currentMonth < nextMonth) {
            let day = currentMonth.getDate().toString().padStart(2, '0');
            let dateStr = currentMonth.getFullYear() + '-' + month + '-' + day;

            let data = {
                date: dateStr,
            };

            if (config.fill.hasOwnProperty(dateStr)) {
                data.total = config.fill[dateStr];
            }
            monthDays.push(data);
            currentMonth.setDate(currentMonth.getDate() + 1);
        }
        days.unshift(...monthDays)
    }

    days = days.slice(days.length % 365);

    return { days, months };
}

const datas = await api.runOnBackend(() => {
    const editedNotes = api.sql.getMap(`SELECT date , COUNT(*) FROM (
            SELECT noteId, SUBSTR(utcDateModified, 0, 11) AS date FROM notes
            UNION
            SELECT DISTINCT noteId, SUBSTR(utcDateCreated, 0, 11) AS date FROM note_revisions
        )
        GROUP BY date`);
    return editedNotes;
});

const width = 1000;
const height = 180;
const margin = 30;
const weekBoxWidth = 20;
const monthBoxHeight = 20;

function updateCells(cellBox, dataset) {
    const cellMargin = 3;
    const cellSize = (height - margin - monthBoxHeight - cellMargin * 6 - 10) / 7;
    let cellCol = 1;
    const colorScale = d3.scaleSequential()
        .domain(dataRange)
        .interpolator(d3.interpolateRgb(colorRange[0], colorRange[1]));

    const weekOffset = (new Date(dataset.days[0].date).getDay() + 6) % 7;

    const cells = cellBox.selectAll('rect').data(dataset.days);

    cells.attr('fill', v => {
            if (v.total == undefined) {
                return '#EFEFEF';
            }
            if (v.total >= 1) {
                return colorScale(v.total);
            }
        })
        .attr('x', (v, i) => {
            if ((i + weekOffset) % 7 == 0 && i != 0) {
                cellCol++;
            }
            const x = (cellCol - 1) * cellSize;
            const offset = Math.floor(i / (365)) * -((cellMargin + cellSize) * 52);
            return offset + (cellCol > 1 ? x + cellMargin * (cellCol - 1) : x);
        })
        .attr('y', (v, i) => {
            const y = (i + weekOffset) % 7;
            const offset = Math.floor(i / (365)) * height;
            return offset + (y > 0 ? y * cellSize + cellMargin * y : y * cellSize);
        });

    cells.enter()
        .append('rect')
        .attr('width', cellSize)
        .attr('height', cellSize)
        .attr('rx', 3)
        .attr('fill', v => {
            if (v.total == undefined) {
                return '#EFEFEF';
            }
            if (v.total >= 1) {
                return colorScale(v.total);
            }
        })
        .attr('x', (v, i) => {
            if ((i + weekOffset) % 7 == 0 && i != 0) {
                cellCol++;
            }
            const x = (cellCol - 1) * cellSize;
            const offset = Math.floor(i / (365)) * -((cellMargin + cellSize) * 52);
            return offset + (cellCol > 1 ? x + cellMargin * (cellCol - 1) : x);
        })
        .attr('y', (v, i) => {
            const y = (i + weekOffset) % 7;
            const offset = Math.floor(i / (365)) * height;
            return offset + (y > 0 ? y * cellSize + cellMargin * y : y * cellSize);
        })
        .on("mouseover", function(d, v) {
            const element = d3.select(this);
            element.style("stroke", "black");
            const parentElement = document.getElementById("trilium-heatmap");
            const elementSVG = parentElement.getBoundingClientRect();

            const x = d.pageX - elementSVG.left;
            const y = d.pageY - elementSVG.top;
            const tooltip = document.getElementById("heatmap-tooltip");
            if (v.total == undefined) { v.total = '0'; }
            tooltip.innerHTML = `${v.total.toString()} notes Modified in ${v.date}`;
            tooltip.style.left = `${x + offsetX}px`;
            tooltip.style.top = `${y + offsetY}px`;
            tooltip.style.display = "block";
        })
        .on("mouseout", function(d) {
            const element = d3.select(this);
            element.style("stroke", null); 
            const tooltip = document.getElementById("heatmap-tooltip");
            tooltip.style.display = "none";
        })
        .on("click", async function(d, v) {
            const noteId = await api.runAsyncOnBackendWithManualTransactionHandling(async (date) => {
                const note = await api.getDayNote(date);
                return note.noteId;
            }, [v.date]);
            await api.waitUntilSynced();
            api.activateNote(noteId);
       });

    cells.exit().remove();
}

function drawHeatmap(endDate=null){
    const dataset = generateDataset(12, {
        endDate: endDate,
        fill: datas,
    });

    d3.select('#trilium-heatmap')
        .selectAll("*")
        .remove();

    const svg = d3.select('#trilium-heatmap')
        .attr('width', width)
        .attr('height', height);

    const monthBox = svg.append('g').attr(
        'transform',
        `translate(${margin + weekBoxWidth}, ${margin})`
    );

    const monthScale = d3.scaleLinear()
        .domain([0, dataset.months.length])
        .range([0, width - margin - weekBoxWidth + 10]);

    monthBox.selectAll('text').data(dataset.months).enter()
        .append('text')
        .text(v => v)
        .attr('font-size', '16px')
        .attr('fill', '#999')
        .attr('cursor', 'default')
        .attr('x', (v, i) => monthScale(i % 12))
        .attr('y', (v, i) => Math.floor(i / 12) * height);

    const weekBox = svg.append('g').attr(
         'transform',
         `translate(${margin - 10}, ${margin + monthBoxHeight})`
     );
     const weekScale = d3.scaleLinear()
         .domain([0, weeks.length])
         .range([0, height - margin - monthBoxHeight + 15]);

     weekBox.selectAll('text').data(weeks).enter()
         .append('text')
         .text(v => v)
         .attr('font-size', '0.85em')
         .attr('fill', '#CCC')
         .attr('y', (v, i) => weekScale(i));

     const cellBox = svg.append('g').attr(
         'transform',
         `translate(${margin + weekBoxWidth}, ${margin + 10})`
     );

     updateCells(cellBox, dataset);
    const previousButton = document.getElementById("button-previous");
    const nextButton = document.getElementById("button-next");
    previousButton.addEventListener("click", handlePreviousButtonClick);
    nextButton.addEventListener("click", handleNextButtonClick);
    function handlePreviousButtonClick() {
        const previousEndDate = new Date(dataset.months[0]);
        previousEndDate.setMonth(previousEndDate.getMonth() - 1);
        drawHeatmap(previousEndDate);
        
        previousButton.removeEventListener("click", handlePreviousButtonClick);
        nextButton.removeEventListener("click", handleNextButtonClick);
    }

    function handleNextButtonClick() {
        const nextEndDate = new Date(new Date(dataset.months[dataset.months.length-1]));
        nextEndDate.setMonth(nextEndDate.getMonth() + 12);
        drawHeatmap(nextEndDate);

        previousButton.removeEventListener("click", handlePreviousButtonClick);
        nextButton.removeEventListener("click", handleNextButtonClick);
    }
}

drawHeatmap();