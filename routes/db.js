const { Model, DataTypes, Sequelize } = require("sequelize");
const uuid = require('uuid').v4;

class Thread extends Model {

   static init(sequelize) {
      super.init({
         _id: {
            defaultValue: uuid,
            primaryKey: true,
            type: DataTypes.STRING,
         },
         text: {
            type: DataTypes.TEXT,
            allowNull: false,
         },
         created_on: {
            type: DataTypes.DATE,
            defaultValue: Date.now,
         },
         bumped_on: {
            type: DataTypes.DATE,
            defaultValue: Date.now,
         },
         delete_password: {
            type: DataTypes.STRING,
            allowNull: false,
         },
         reported: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
         },
         board: {
            type: DataTypes.STRING,
            allowNull: false,
         }
      }, { sequelize, timestamps: false });
   }
}


class Reply extends Model {

   static init(sequelize) {
      super.init({
         _id: {
            defaultValue: uuid,
            primaryKey: true,
            type: DataTypes.STRING,
         },
         text: {
            type: DataTypes.TEXT,
            allowNull: false,
         },
         created_on: {
            type: DataTypes.DATE,
            defaultValue: Date.now,
         },
         delete_password: {
            type: DataTypes.STRING,
            allowNull: false,
         },
         reported: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
         }
      }, { sequelize, timestamps: false });
   }
}


const dialect = `sqlite::${__dirname}/db.sqlite`;
const sequelize = new Sequelize(dialect, { logging: false, dialect: 'sqlite' });

async function init() {
   
   Thread.init(sequelize);
   Reply.init(sequelize);

   Thread.hasMany(Reply, {
      foreignKey: {
         name: 'thread',
         allowNull: false,
      },
      onDelete: "CASCADE"
   });

   await sequelize.sync({ force: true });

}


module.exports = {
   init,
   Reply,
   Thread,
}