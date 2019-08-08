class PpmSettings{
    constructor(orgUnit, wbs, assignedTo, requirementType, reason, impact, urgency, description, 
        categoryApplication, clientId, requestorName, location, detailedDescription)
    {
        this.orgUnit = orgUnit;
        this.wbs = wbs;
        this.assignedTo = assignedTo;
        this.requirementType = requirementType;
        this.reason = reason;
        this.impact = impact;
        this.urgency = urgency;
        this.description = description;
        this.categoryApplication = categoryApplication;
        this.clientId = clientId;
        this.requestorName = requestorName;
        this.location = location;
        this.detailedDescription = detailedDescription;
    }
}
module.exports.PpmSettings = PpmSettings;
