class TicketPPM {
    constructor(orgUnit, wbs, requirementType, impact, urgency, priority,
         description, assignedTo, reason, clientId, categoryApplication, location, detailedDescription)
    {
        this.orgUnit = orgUnit;
        this.wbs = wbs;
        this.requirementType = requirementType;
        this.impact = impact;
        this.urgency = urgency;
        this.priority = priority;
        this.description = description;
        this.assignedTo = assignedTo;
        this.reason = reason;
        this.clientId = clientId;
        this.categoryApplication = categoryApplication;
        this.location = location;
        this.detailedDescription = detailedDescription;
    }
}

module.exports.TicketPPM = TicketPPM;
