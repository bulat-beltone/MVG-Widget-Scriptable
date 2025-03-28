// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: blue; icon-glyph: subway;
// noinspection LanguageDetectionInspection

// Select means of transport true for display and false for no display
const sbahn = true;
const ubahn = false;
const bus = false;
const regionalBus = false;
const tram = false;
const zug = false;

const offsetInMinutes = 0; // Es werden erst Verbindungen angezeigt, die X Minuten in der Zukunft liegen

// Configurable filters now dynamically parsed from widgetParameter

// Dont change anything below this line if you dont know what you are doing ;)

//const station = "Marienplatz" // For Debug in the App remove the //

// Parse widgetParameter into an array (e.g., ["Marienplatz", "1", "S3,S4"])

const parameters = args.widgetParameter ? args.widgetParameter.split(",") : [];

const station = parameters[0]?.trim(); // Station is required
if (!station) {
    throw new Error("Station name is required in widget parameters (e.g., 'Marienplatz').");
}

const platform = parameters[1] ? Number(parameters[1].trim()) : null; // Optional platform (null if not provided)

const labels = parameters[2]
    ? parameters[2].split(";").map(label => label.trim()) // Split multiple labels by semicolon (e.g., "S3;S4")
    : null; // Optional labels (null if not provided)

const bgColor = parameters[3] ? parameters[3].trim() : "#1C1C1C"; // Default background color

//Adds "&" to combined station and replace umlauts
let clearstation = station.replace(" ","&").replace("ß","ss").replace("ü","ue").replace("ä","ae").replace("ö","oe")

//Get Station ID
const mvgstatID = "https://www.mvg.de/api/bgw-pt/v3/locations?query=" + clearstation
let responseID = await new Request(mvgstatID).loadJSON()

// Store the Global ID
let globalId = "";
if (responseID.length > 0) {
    // Extract the globalId of the first station
    const firstStation = responseID.find(entry => entry.type === "STATION");
    if (firstStation) {
        globalId = firstStation.globalId;
        //console.log("Global ID: " + globalId);
    } else {
        console.log("No station found in the response.");
    }
} else {
    console.log("No results found for the given query.");
}

// create transportTypes dynamically
const defaultTransportTypes = "SBAHN,UBAHN,TRAM,BUS,REGIONAL_BUS"; // dont change
let transportTypes = [];
if (bus) transportTypes.push("BUS");
if (regionalBus) transportTypes.push("REGIONAL_BUS");
if (ubahn) transportTypes.push("UBAHN");
if (sbahn) transportTypes.push("SBAHN");
if (tram) transportTypes.push("TRAM");
if (zug) transportTypes.push("BAHN");

// set default transportTypes
if (transportTypes.length === 0) {
    transportTypes = defaultTransportTypes.split(',');
}

// API Request
const mvgReq = "https://www.mvg.de/api/bgw-pt/v3/departures?globalId=" + globalId + "&limit=80&offsetInMinutes=" + offsetInMinutes + "&transportTypes=" + transportTypes.join(',');

// API Request durchführen
let response = await new Request(mvgReq).loadJSON();

// Custom filtering: Dynamically filter based on platform and labels if provided
response = response.filter(entry => {
    // Filter by labels if provided, or accept all
    const labelMatches = labels ? labels.includes(entry.label) : true;

    // Filter by platform if provided, or accept all
    const platformMatches = platform ? entry.platform === platform : true;

    return labelMatches && platformMatches;
});

//Formats a Unix timestamp into HH:mm format
function formatDepartureTime(timestamp) {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

//Calculates expected departure incl. delay
function calculateDeparture(delay, time) {
    if (delay === undefined) {
        return { recalculatedTime: time, isDelayed: false };
    } else {
        return { recalculatedTime: delay + time, isDelayed: true };
    }
}

//Shorten text, if length exceeds space
function truncate(text, n = 22) {
    return (text.length > n) ? text.substr(0, n-1) + '...' : text
}

function createDateString() {
    const now = new Date(Date.now());
    let hours = (now.getHours().toString().length > 1) ? now.getHours().toString() : "0" + now.getHours().toString();
    let minutes = (now.getMinutes().toString().length > 1) ? now.getMinutes().toString() : "0" + now.getMinutes().toString();
    return hours + ":" + minutes; // Return only HH:mm format
}


function getLineColor(transportType, label) {
    switch (transportType) {
        case "UBAHN":
            switch (label) {
                case "U1": return "#438136";
                case "U2": return "#C40C37";
                case "U3": return "#F36E31";
                case "U4": return "#0AB38D";
                case "U5": return "#B8740E";
                case "U6": return "#006CB3";
                default:
                    return "#000000";
            }
        case "SBAHN":
            switch (label) {
                case "S1": return "#16BAE7";
                case "S2": return "#76B82A";
                case "S3": return "#834DF0";
                case "S4": return "#DB3B4B";
                case "S5": return "#005E82";
                case "S6": return "#00975F";
                case "S7": return "#943126";
                case "S8": return "#000000";
                case "S20": return "#ED6B83";
                default: return "#FFFFFF"; // Standard (White)
            }
        case "BUS":          return "#00586A";
        case "REGIONAL_BUS": return "#4682B4";
        case "TRAM":         return "#D82020";
        default:
            return "#FFFFFF"; // Standard (White)
    }
}

const widgetSize = (config.widgetFamily ? config.widgetFamily : 'large');
const widget = await createWidget()

if (!config.runInWidget) {
    switch(widgetSize) {
        case 'small':
            await widget.presentSmall();
            break;

        case 'large':
            await widget.presentLarge();
            break;

        default:
            await widget.presentMedium();
    }
}

Script.setWidget(widget)

function createWidget() {
    let ITEMS_COUNT
    let HEADER_SIZE
    let COLUMN_HEIGHT
    let SPACING
    let PADDING
    let LOGO_SIZE
    let STATION_SIZE
    let DEPART_SIZE
    let LOGO_FONT_SIZE
    let STATION_FONT_SIZE
    let DEPART_FONT_SIZE
    let HEADLINE_FONT_SIZE
    let FOOTER_HEIGHT
    let FOOTER_FONT_SIZE

    if (widgetSize == 'small') {
        ITEMS_COUNT = 3
        HEADER_SIZE = 16
        COLUMN_HEIGHT = 15
        SPACING = 3
        PADDING = SPACING
        LOGO_SIZE = new Size(20, COLUMN_HEIGHT)
        STATION_SIZE = new Size(60, COLUMN_HEIGHT)
        DEPART_SIZE = new Size(40, COLUMN_HEIGHT)
        LOGO_FONT_SIZE = 12
        STATION_FONT_SIZE = 14
        DEPART_FONT_SIZE = 12
        HEADLINE_FONT_SIZE = 16
        FOOTER_HEIGHT = 20
        FOOTER_FONT_SIZE = 10
    } else if (widgetSize == 'medium') {
        ITEMS_COUNT = 3
        HEADER_SIZE = 25
        COLUMN_HEIGHT = 20
        SPACING = 5
        PADDING = SPACING
        LOGO_SIZE = new Size(35, COLUMN_HEIGHT)
        STATION_SIZE = new Size(185, COLUMN_HEIGHT)
        DEPART_SIZE = new Size(60, COLUMN_HEIGHT)
        LOGO_FONT_SIZE = 14
        STATION_FONT_SIZE = 20
        DEPART_FONT_SIZE = 16
        HEADLINE_FONT_SIZE = 24
        FOOTER_HEIGHT = 10
        FOOTER_FONT_SIZE = 8
    } else {
        ITEMS_COUNT = 8
        HEADER_SIZE = 30
        COLUMN_HEIGHT = 20
        SPACING = 5
        PADDING = SPACING
        LOGO_SIZE = new Size(35, COLUMN_HEIGHT)
        STATION_SIZE = new Size(185, COLUMN_HEIGHT)
        DEPART_SIZE = new Size(60, COLUMN_HEIGHT)
        LOGO_FONT_SIZE = 14
        STATION_FONT_SIZE = 20
        DEPART_FONT_SIZE = 16
        HEADLINE_FONT_SIZE = 24
        FOOTER_HEIGHT = 25
        FOOTER_FONT_SIZE = 8
    }

    // Widget
    const widget = new ListWidget();
    widget.backgroundColor = new Color(bgColor); // Use user-provided or default background color
    widget.setPadding(PADDING, PADDING, PADDING, PADDING);

    // Main stack
    const stack = widget.addStack();
    stack.layoutVertically();
    stack.topAlignContent();

    // Top stack for station headline
    const topStack = stack.addStack();
    topStack.layoutVertically();
    //topStack.centerAlignContent()
    topStack.size = new Size(LOGO_SIZE.width + STATION_SIZE.width + DEPART_SIZE.width + 2*SPACING, HEADER_SIZE);

    const stationName = topStack.addText(station.replace(/^München-/, '').toString());
    stationName.textColor = Color.white();
    stationName.leftAlignText()
    stationName.font = Font.boldSystemFont(HEADLINE_FONT_SIZE)

    // Horizontal spacer under headline (station) string
    stack.addSpacer(8);

    for (let i = 0; i < ITEMS_COUNT; i++) {
        // Will be set up with 3 columns to show line, destination and departure time
        const bottomStack = stack.addStack();
        bottomStack.spacing = SPACING
        bottomStack.size = new Size(LOGO_SIZE.width + STATION_SIZE.width + DEPART_SIZE.width + 2*SPACING, COLUMN_HEIGHT + 2*SPACING)
        bottomStack.layoutHorizontally();
        bottomStack.centerAlignContent()

        let transportType = response[i].transportType;
        let label = response[i].label;
        let lineColor = getLineColor(transportType, label);

        const linestack = bottomStack.addStack();
        linestack.size = LOGO_SIZE
        linestack.centerAlignContent()

        let lineName = linestack.addText(label)
        if (label === "U7") {
            linestack.backgroundColor = new Color("#C40C37");
            lineName.textColor = new Color("#438136");
        } else if (label === "U8") {
            linestack.backgroundColor = new Color("#F36E31");
            lineName.textColor = new Color("#C40C37");
        } else {
            linestack.backgroundColor = new Color(lineColor);
            linestack.cornerRadius = 4; // Adds rounded corners

            lineName.textColor = Color.white(); // Standard Textcolor
        }

        lineName.font = Font.boldSystemFont(LOGO_FONT_SIZE)
        lineName.centerAlignText()
        lineName.minimumScaleFactor = 0.4

        const destinationStack = bottomStack.addStack();
        destinationStack.size = STATION_SIZE
        destinationStack.layoutVertically()
        destinationStack.bottomAlignContent()

        let destinationName = destinationStack.addText(truncate(response[i].destination.toString()))
        destinationName.font = Font.lightSystemFont(STATION_FONT_SIZE)
        destinationName.textColor = Color.white()
        destinationName.leftAlignText()
        destinationName.minimumScaleFactor = 0.95

        const departureStack = bottomStack.addStack();
        departureStack.size = DEPART_SIZE
        departureStack.bottomAlignContent()

        // Add ' Min' extension if we have space for that
        let extension = ""
        if (widgetSize == 'medium' ||  widgetSize == 'large') {
            extension = " Min"
        }

        // Calculate the departure time and retrieve the delay flag
        let { recalculatedTime, isDelayed } = calculateDeparture(response[i].delay, response[i].realtimeDepartureTime);

        // Display the absolute departure time in HH:mm format
        let departureTime = departureStack.addText(formatDepartureTime(recalculatedTime));
        departureTime.font = Font.boldSystemFont(DEPART_FONT_SIZE);
        departureTime.textColor = isDelayed ? Color.red() : Color.white(); // Set color based on delay flag
        departureTime.rightAlignText();
        departureTime.minimumScaleFactor = 0.95;
    }

    const updatedstack = stack.addStack();
    updatedstack.bottomAlignContent()
    updatedstack.size = new Size(LOGO_SIZE.width + STATION_SIZE.width + DEPART_SIZE.width + 2*SPACING, FOOTER_HEIGHT)
    let lastUpdateTime = updatedstack.addText(createDateString())
    lastUpdateTime.font = Font.lightSystemFont(FOOTER_FONT_SIZE)
    lastUpdateTime.textColor = Color.white()
    lastUpdateTime.rightAlignText()
    lastUpdateTime.textOpacity = 0.8
    lastUpdateTime.minimumScaleFactor = 0.95

    return widget;
}

Script.complete()

