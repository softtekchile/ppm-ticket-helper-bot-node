class PpmSettings{
    constructor(orgUnit, wbs, requirementType, location, impact, urgency, description, 
        assignedTo, reason, clientId, categoryApplication, detailedDescription)
    {
        this.orgUnit = orgUnit;
        this.wbs = wbs;
        this.requirementType = requirementType;
        this.location = location;
        this.impact = impact;
        this.urgency = urgency;
        this.description = description;
        this.assignedTo = assignedTo;
        this.reason = reason;
        this.clientId = clientId;
        this.categoryApplication = categoryApplication;
        this.detailedDescription = detailedDescription;
    }
}
module.exports.PpmSettings = PpmSettings;
