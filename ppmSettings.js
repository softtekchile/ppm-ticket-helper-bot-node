class PpmSettings{
    constructor(description, assignedTo, reason, clientId, categoryApplication, detailedDescription)
    {
        this.orgUnit = '1-0000013297-1';
        this.wbs = '1-0000013297-1';
        this.requirementType = 'Services';
        this.location = 'Chile';
        this.impact = 'low';
        this.urgency = 'low';
        this.priority = 'medium';
        this.ticketState = 'Iniciado';

        this.description = description;
        this.assignedTo = assignedTo;
        this.reason = reason;
        this.clientId = clientId;
        this.categoryApplication = categoryApplication;
        this.detailedDescription = detailedDescription;
    }
}
module.exports.PpmSettings = PpmSettings;
