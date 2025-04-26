let steamData;
const tooltipPadding = 15;

const resizeAndRender = () => {
    d3.selectAll("#disc-visualization-container > *").remove();

    renderVisualization();

    d3.selectAll("text")
        .attr("font-size", function() { return d3.select(this).attr("text-multiplier") * 0.008 * document.getElementById("disc-visualization-container").clientWidth });

    d3.select("#tooltip")
        .style("border-radius", 0.02 * document.getElementById("disc-visualization-container").clientHeight + "px");
};

window.onresize = resizeAndRender;

const getDiscSVGId = g => g.title.replace(/['\s:\!\d\.|]/gm, "");

const setupSingleDisc = (game) => {
    const discSVGId = getDiscSVGId(game);
    const containerWidth = document.getElementById(discSVGId).clientWidth;
    const containerHeight = document.getElementById(discSVGId).clientHeight;

    const margin = {
        top: 0 * containerHeight,
        right: 0 * containerWidth,
        bottom: 0 * containerHeight,
        left: 0 * containerWidth
    };

    const width = containerWidth - (margin.right + margin.left);
    const height = containerHeight - (margin.top + margin.bottom);

    const svg = d3.select(`#${discSVGId}`);
    const chartArea = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    const achievementScale = d3.scaleSqrt()
        .domain([0, 1])
        .range([width / 7, width / 2]);

    const ratingColours = ["#7b3294", "#c2a5cf", "#f7f7f7", "#a6dba0", "#388A3F"];

    chartArea.append("path")
        .attr("fill", ratingColours[game.rating - 1])
        .attr("transform", `translate(${width / 2}, ${height / 2})`)
        .attr("d", d3.arc()({
          innerRadius: width / 14,
          outerRadius: width / 7 + 1,
          startAngle: 0,
          endAngle: 2 * Math.PI
        }));

    chartArea.append("path")
        .attr("fill", "#E6766E")
        .attr("transform", `translate(${width / 2}, ${height / 2})`)
        .attr("d", d3.arc()({
            innerRadius: width / 7,
            outerRadius: achievementScale(game.achievementPercentage) + 1,
            startAngle: 0,
            endAngle: 2 * Math.PI
        }));

    chartArea.append("path")
        .attr("fill", "#f1dede")
        .attr("transform", `translate(${width / 2}, ${height / 2})`)
        .attr("d", d3.arc()({
            innerRadius: achievementScale(game.achievementPercentage),
            outerRadius: width / 2,
            startAngle: 0,
            endAngle: 2 * Math.PI
        }));

    const yearScale = d3.scaleLinear()
        .domain([2012, 2025])
        .range([9 * width / 56, 27 * width / 56]);

    const dayScale = d3.scaleLinear()
        .domain([0, 365])
        .range([0, 2 * Math.PI]);

    const yearRings = [];
    if (game.ownDate.year() === game.lastPlayed.year()) {
        yearRings.push({ year: game.ownDate.year(), start: game.ownDate.dayOfYear(), end: game.lastPlayed.dayOfYear() })
    } else if (game.ownDate.year() + 1 === game.lastPlayed.year()) {
        yearRings.push({ year: game.ownDate.year(), start: game.ownDate.dayOfYear(), end: 365 })
        yearRings.push({ year: game.lastPlayed.year(), start: 0, end: game.lastPlayed.dayOfYear() })
    } else {
        yearRings.push({ year: game.ownDate.year(), start: game.ownDate.dayOfYear(), end: 365 })
        for (let year = game.ownDate.year() + 1; year < game.lastPlayed.year(); year++) {
            yearRings.push({ year: year, start: 0, end: 365 })
        }
        yearRings.push({ year: game.lastPlayed.year(), start: 0, end: game.lastPlayed.dayOfYear() })
    }

    chartArea.selectAll(".year-rings")
        .data(yearRings)
        .join("path")
        .attr("fill", "#1A2059")
        .attr("opacity", 0.3)
        .attr("transform", `translate(${width / 2}, ${height / 2})`)
        .attr("d", y => d3.arc()({
            innerRadius: yearScale(y.year),
            outerRadius: yearScale(y.year) + 1,
            startAngle: dayScale(y.start),
            endAngle: dayScale(y.end)
            }));

    let textMultiplier = 1;
    if (window.innerWidth < 1680) {
        textMultiplier = 8 / 6;
    }
    if (window.innerWidth < 1280) {
        textMultiplier = 8 / 3;
    }
    if (window.innerWidth < 736) {
        textMultiplier = 8 / 2;
    }

    chartArea.selectAll(".year-labels")
        .data([2012, 2014, 2016, 2018, 2020, 2022, 2024])
        .join("text")
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("transform", d => `translate(${width / 2}, ${height / 2 + yearScale(d)})`)
        .attr("text-multiplier", textMultiplier / 3)
        .text(d => d)

    if (game.title.length < 19) {
        chartArea.append("text")
            .attr("text-anchor", "middle")
            .attr("transform", `translate(${width / 2}, ${height / 4})`)
            .attr("text-multiplier", textMultiplier)
            .text(game.title);
    } else if (game.title.includes(":")) {
        chartArea.append("text")
            .attr("text-anchor", "middle")
            .attr("transform", `translate(${width / 2}, ${height / 5})`)
            .attr("text-multiplier", textMultiplier)
            .text(game.title.split(":")[0] + ":");
        chartArea.append("text")
            .attr("text-anchor", "middle")
            .attr("transform", `translate(${width / 2}, ${3 * height / 10})`)
            .attr("text-multiplier", textMultiplier)
            .text(game.title.split(":")[1]);
    } else {
        chartArea.append("text")
            .attr("text-anchor", "middle")
            .attr("transform", `translate(${width / 2}, ${height / 5})`)
            .attr("text-multiplier", textMultiplier)
            .text(game.title.split("|")[0]);
        chartArea.append("text")
            .attr("text-anchor", "middle")
            .attr("transform", `translate(${width / 2}, ${3 * height / 10})`)
            .attr("text-multiplier", textMultiplier)
            .text(game.title.split("|")[1]);
    }

    const hourDotData = Array.from(Array(Math.floor(game.hours / 10)).keys()).map(_ => 1);
    hourDotData.push((game.hours % 10) / 10)

    chartArea.selectAll(".hour-dots")
        .data(hourDotData)
        .join("circle")
        .attr("class", "hour-dot")
        .attr("fill", "#1A2059")
        .attr("transform", `translate(${width / 2}, ${height / 2})`)
        .attr("cx", (_, i) => 11 / 102 * width * Math.cos(i / 22 * 2 * Math.PI - Math.PI / 2))
        .attr("cy", (_, i) => 11 / 102 * width * Math.sin(i / 22 * 2 * Math.PI - Math.PI / 2))
        .attr("r", 1 * width / 102)
        .attr("fill-opacity", d => d)
};

const renderVisualization = () => {
    const container = d3.select("#disc-visualization-container");
    const discs = container.selectAll(".disc")
        .data(steamData)
        .join("div")
        .attr("class", "disc")
        .style("text-align", "center");

    discs.selectAll(".disc-svg")
        .data(d => [d])
        .join("svg")
        .attr("class", "disc-svg")
        .attr("id", getDiscSVGId);

    discs.selectAll(".disc-review")
        .data(d => [d])
        .join("i")
        .attr("class", "disc-review")
        .text(d => d.review);

    steamData.forEach(setupSingleDisc);
};

Promise.all([d3.json('data/steam-data.json')]).then(([_steamData]) => {
    dayjs.extend(window.dayjs_plugin_dayOfYear) 

    steamData = _steamData;
    steamData.forEach(d => {
        if (d.ownDate.includes("*")) {
            d.ownDateUncertain = true;
            d.ownDate = d.ownDate.replace("*", "");
        } else {
            d.ownDateUncertain = false;
        }
        d.ownDate = dayjs(d.ownDate);
        d.lastPlayed = dayjs(d.lastPlayed);
        const [got, total] = d.achievements.split("/");
        if (total === "0") {
            d.achievementPercentage = 0;
        } else {
            d.achievementPercentage = got / total;
        }
    });

    resizeAndRender();
});