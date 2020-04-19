import request from "requestretry";
import { CronJob } from "cron";

import server from "./server";
import { getSensorsFromDumpSync } from "./handlers/sensors";
import { mergeSensorsWithIndications } from "./handlers/requestFormatter";
import { getIndicationsFromDumpSync, updateIndicationsIndex, dumpIndicationsSync } from "./handlers/indications";

const getNextSensorToPoll = (lastPolledSensor: string, sensorsCount: number) => {
    const lastPolledSensorNumber = parseInt(lastPolledSensor);

    if (lastPolledSensorNumber === sensorsCount - 1) {
        return "0";
    }

    return (lastPolledSensorNumber + 1).toString();
};

server.listen(3000, () => {
    const SENSORS = getSensorsFromDumpSync();

    let NEXT_SENSOR_TO_POLL = "0";
    let INDICATIONS = getIndicationsFromDumpSync();

    // Every 2 seconds sends next sensor indication
    // */2 for one per 2 sec
    new CronJob("*/2 * * * * *", () => {
        const updatedIndications = updateIndicationsIndex(INDICATIONS, NEXT_SENSOR_TO_POLL);
        const requestBody = mergeSensorsWithIndications(SENSORS, updatedIndications)[NEXT_SENSOR_TO_POLL];

        request.post({
            url: "http://localhost:80/pushData",
            // url: "http://localhost:3000/pushData",
            json: true,
            headers: {
                "Content-Type": "application/json",
                "token": "{token}",
            },
            body: requestBody,

            maxAttempts: 3,   // try 3 times
            retryDelay: 30000,  // wait for 30_000ms before trying again
        }, (err) => {
            if (err) {
                 return console.warn(err);
            }

            INDICATIONS = updatedIndications;
            NEXT_SENSOR_TO_POLL = getNextSensorToPoll(NEXT_SENSOR_TO_POLL, Object.keys(SENSORS).length);
            dumpIndicationsSync(updatedIndications);
        });
    }, null, true, "America/Los_Angeles");

    console.log(`Express web server started. Port: 3000`);
});
