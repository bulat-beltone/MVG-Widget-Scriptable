// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: blue; icon-glyph: subway;
// noinspection LanguageDetectionInspection

// Configuration
const CONFIG = {
    // Transport types to display (true = display, false = hide)
    transportTypes: {
        sbahn: true,
        ubahn: false,
        bus: false,
        regionalBus: false,
        tram: false,
        zug: false
    },
    offsetInMinutes: 0, // Only show connections that are X minutes in the future
    defaultBackgroundColor: "#1C1C1C",
    defaultTransportTypes: "SBAHN,UBAHN,TRAM,BUS,REGIONAL_BUS"
};

// Widget size configurations
const WIDGET_CONFIG = {
    small: {
        itemsCount: 3,
        headerSize: 16,
        columnHeight: 15,
        spacing: 3,
        padding: 3,
        logoSize: new Size(20, 15),
        stationSize: new Size(60, 15),
        departSize: new Size(40, 15),
        logoFontSize: 12,
        stationFontSize: 14,
        departFontSize: 12,
        headlineFontSize: 16,
        footerHeight: 20,
        footerFontSize: 10
    },
    medium: {
        itemsCount: 3,
        headerSize: 25,
        columnHeight: 20,
        spacing: 5,
        padding: 5,
        logoSize: new Size(35, 20),
        stationSize: new Size(185, 20),
        departSize: new Size(60, 20),
        logoFontSize: 14,
        stationFontSize: 20,
        departFontSize: 16,
        headlineFontSize: 24,
        footerHeight: 10,
        footerFontSize: 8
    },
    large: {
        itemsCount: 8,
        headerSize: 30,
        columnHeight: 20,
        spacing: 5,
        padding: 5,
        logoSize: new Size(35, 20),
        stationSize: new Size(185, 20),
        departSize: new Size(60, 20),
        logoFontSize: 14,
        stationFontSize: 20,
        departFontSize: 16,
        headlineFontSize: 24,
        footerHeight: 25,
        footerFontSize: 8
    }
};

// Line colors for different transport types
const LINE_COLORS = {
    UBAHN: {
        U1: "#438136",
        U2: "#C40C37",
        U3: "#F36E31",
        U4: "#0AB38D",
        U5: "#B8740E",
        U6: "#006CB3"
    },
    SBAHN: {
        S1: "#16BAE7",
        S2: "#76B82A",
        S3: "#834DF0",
        S4: "#DB3B4B",
        S5: "#005E82",
        S6: "#00975F",
        S7: "#943126",
        S8: "#000000",
        S20: "#ED6B83"
    },
    BUS: "#00586A",
    REGIONAL_BUS: "#4682B4",
    TRAM: "#D82020"
};

// Parse widget parameters
const parameters = args.widgetParameter ? args.widgetParameter.split(",") : [];
const station = parameters[0]?.trim() || "Marienplatz";
const platform = parameters[1] ? Number(parameters[1].trim()) : null;
const labels = parameters[2] ? parameters[2].split(";").map(label => label.trim()) : null;
const bgColor = parameters[3] ? parameters[3].trim() : CONFIG.defaultBackgroundColor;

// Helper Functions
function formatStationName(station) {
    return station.replace(" ", "&")
        .replace("ß", "ss")
        .replace("ü", "ue")
        .replace("ä", "ae")
        .replace("ö", "oe");
}

function formatDepartureTime(timestamp) {
    const date = new Date(timestamp);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

function calculateDeparture(delay, time) {
    return {
        recalculatedTime: delay === undefined ? time : delay + time,
        isDelayed: delay !== undefined
    };
}

function truncate(text, maxLength = 22) {
    return text.length > maxLength ? text.substr(0, maxLength - 1) + '...' : text;
}

function getCurrentTime() {
    const now = new Date(Date.now());
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
}

function getLineColor(transportType, label) {
    if (transportType === "UBAHN" || transportType === "SBAHN") {
        return LINE_COLORS[transportType][label] || "#FFFFFF";
    }
    return LINE_COLORS[transportType] || "#FFFFFF";
}

// API Integration
async function getStationId(stationName) {
    const formattedStation = formatStationName(stationName);
    const url = `https://www.mvg.de/api/bgw-pt/v3/locations?query=${formattedStation}`;
    const response = await new Request(url).loadJSON();
    
    const firstStation = response.find(entry => entry.type === "STATION");
    return firstStation?.globalId || null;
}

async function getDepartures(globalId) {
    const transportTypes = Object.entries(CONFIG.transportTypes)
        .filter(([_, enabled]) => enabled)
        .map(([type]) => type.toUpperCase());

    const types = transportTypes.length > 0 
        ? transportTypes.join(',') 
        : CONFIG.defaultTransportTypes;

    const url = `https://www.mvg.de/api/bgw-pt/v3/departures?globalId=${globalId}&limit=80&offsetInMinutes=${CONFIG.offsetInMinutes}&transportTypes=${types}`;
    return await new Request(url).loadJSON();
}

// Widget Creation
async function createWidget() {
    const widgetSize = config.widgetFamily || 'large';
    const widgetConfig = WIDGET_CONFIG[widgetSize];
    
    // Get station data
    const globalId = await getStationId(station);
    if (!globalId) {
        throw new Error("Station not found");
    }

    // Get and filter departures
    let departures = await getDepartures(globalId);
    departures = departures.filter(entry => {
        const labelMatches = labels ? labels.includes(entry.label) : true;
        const platformMatches = platform ? entry.platform === platform : true;
        return labelMatches && platformMatches;
    });

    // Create widget
    const widget = new ListWidget();
    widget.backgroundColor = new Color(bgColor);
    widget.setPadding(widgetConfig.padding, widgetConfig.padding, widgetConfig.padding, widgetConfig.padding);

    // Add header
    const mainStack = widget.addStack();
    mainStack.layoutVertically();
    mainStack.topAlignContent();

    // Station name header
    const headerStack = mainStack.addStack();
    headerStack.layoutVertically();
    headerStack.size = new Size(
        widgetConfig.logoSize.width + widgetConfig.stationSize.width + widgetConfig.departSize.width + 2 * widgetConfig.spacing,
        widgetConfig.headerSize
    );

    const stationName = headerStack.addText(station.replace(/^München-/, ''));
    stationName.textColor = Color.white();
    stationName.leftAlignText();
    stationName.font = Font.boldSystemFont(widgetConfig.headlineFontSize);

    mainStack.addSpacer(8);

    // Add departure rows
    for (let i = 0; i < widgetConfig.itemsCount; i++) {
        const rowStack = mainStack.addStack();
        rowStack.spacing = widgetConfig.spacing;
        rowStack.size = new Size(
            widgetConfig.logoSize.width + widgetConfig.stationSize.width + widgetConfig.departSize.width + 2 * widgetConfig.spacing,
            widgetConfig.columnHeight + 2 * widgetConfig.spacing
        );
        rowStack.layoutHorizontally();
        rowStack.centerAlignContent();

        // Line number
        const lineStack = rowStack.addStack();
        lineStack.size = widgetConfig.logoSize;
        lineStack.centerAlignContent();

        const lineName = lineStack.addText(departures[i].label);
        const lineColor = getLineColor(departures[i].transportType, departures[i].label);
        
        if (departures[i].label === "U7" || departures[i].label === "U8") {
            lineStack.backgroundColor = new Color(departures[i].label === "U7" ? "#C40C37" : "#F36E31");
            lineName.textColor = new Color(departures[i].label === "U7" ? "#438136" : "#C40C37");
        } else {
            lineStack.backgroundColor = new Color(lineColor);
            lineStack.cornerRadius = 4;
            lineName.textColor = Color.white();
        }

        lineName.font = Font.boldSystemFont(widgetConfig.logoFontSize);
        lineName.centerAlignText();
        lineName.minimumScaleFactor = 0.4;

        // Destination
        const destinationStack = rowStack.addStack();
        destinationStack.size = widgetConfig.stationSize;
        destinationStack.layoutVertically();
        destinationStack.bottomAlignContent();

        const destinationName = destinationStack.addText(truncate(departures[i].destination));
        destinationName.font = Font.lightSystemFont(widgetConfig.stationFontSize);
        destinationName.textColor = Color.white();
        destinationName.leftAlignText();
        destinationName.minimumScaleFactor = 0.95;

        // Departure time
        const departureStack = rowStack.addStack();
        departureStack.size = widgetConfig.departSize;
        departureStack.bottomAlignContent();

        const { recalculatedTime, isDelayed } = calculateDeparture(
            departures[i].delay,
            departures[i].realtimeDepartureTime
        );

        const departureTime = departureStack.addText(formatDepartureTime(recalculatedTime));
        departureTime.font = Font.boldSystemFont(widgetConfig.departFontSize);
        departureTime.textColor = isDelayed ? Color.red() : Color.white();
        departureTime.rightAlignText();
        departureTime.minimumScaleFactor = 0.95;
    }

    // Footer with update time
    const footerStack = mainStack.addStack();
    footerStack.bottomAlignContent();
    footerStack.size = new Size(
        widgetConfig.logoSize.width + widgetConfig.stationSize.width + widgetConfig.departSize.width + 2 * widgetConfig.spacing,
        widgetConfig.footerHeight
    );

    const updateTime = footerStack.addText(getCurrentTime());
    updateTime.font = Font.lightSystemFont(widgetConfig.footerFontSize);
    updateTime.textColor = Color.white();
    updateTime.rightAlignText();
    updateTime.textOpacity = 0.8;
    updateTime.minimumScaleFactor = 0.95;

    return widget;
}

// Main execution
const widget = await createWidget();

if (!config.runInWidget) {
    const widgetSize = config.widgetFamily || 'large';
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

Script.setWidget(widget);
Script.complete();

