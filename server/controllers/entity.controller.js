const Entity = require('../models/entity')

const entityCtrl = {};

entityCtrl.getEntitiesList = async (req, res) => {
    const entitiesList = await Entity.find();
    res.json(entitiesList);
}
entityCtrl.getEntityById = async (req, res) => {
    const entitySingle = await Entity.findById(req.params.id);
    res.json(entitySingle);
}
entityCtrl.editEntityById = async (req, res) => {
    const { id } = req.params;
    const entityUpdate = {
        id: req.body.id,
        name: req.body.name,
        type: req.body.type,
        section: req.body.section
    };
    await Entity.findByIdAndUpdate(id, {$set: entityUpdate}, {new: true});
    res.json({
        status: 'Entity updated'
    });
}
entityCtrl.createEntity = async (req, res) => {
    const newEntity = new Entity({
        id: req.body.id,
        name: req.body.name,
        type: req.body.type,
        section: req.body.section
    })
    await newEntity.save();
    res.json({
        status: 'Entity saved'
    });
}
entityCtrl.deleteEntity = async (req, res) => {
    await Entity.findByIdAndRemove(req.params.id);
    res.json({
        status: 'Entity removed'
    });
}


module.exports = entityCtrl;