module.exports = {
  privGrpus: [
    {
      id: "USERS",
      name: "User Permissions",
    },
    {
      id: "ROLES",
      name: "Roles Permissions",
    },
    {
      id: "CATEGORIES",
      name: "Categories Permissions",
    },
    {
      id: "AUDITLOGS",
      name: "Auditlogs Permissions",
    },
  ],
  privileges: [
    {
      key: "user_view", //kodda kullacanağız
      name: "User View", //Arayüzde kullacanağız
      grop: "USERS",
      description: "User view ",
    },
    {
      key: "user_add", //kodda kullacanağız
      name: "User Add", //Arayüzde kullacanağız
      grop: "USERS",
      description: "User add ",
    },
    {
      key: "user_update", //kodda kullacanağız
      name: "User Update", //Arayüzde kullacanağız
      grop: "USERS",
      description: "User update ",
    },
    {
      key: "user_delete", //kodda kullacanağız
      name: "User Delete", //Arayüzde kullacanağız
      grop: "USERS",
      description: "User delete ",
    },

    {
      key: "role_view", //kodda kullacanağız
      name: "Role View", //Arayüzde kullacanağız
      grop: "ROLES",
      description: "Role view ",
    },
    {
      key: "role_add", //kodda kullacanağız
      name: "Role Add", //Arayüzde kullacanağız
      grop: "ROLES",
      description: "Role add ",
    },
    {
      key: "role_update", //kodda kullacanağız
      name: "Role Update", //Arayüzde kullacanağız
      grop: "ROLES",
      description: "Role update ",
    },
    {
      key: "role_delete", //kodda kullacanağız
      name: "Role Delete", //Arayüzde kullacanağız
      grop: "ROLES",
      description: "Role delete ",
    },

    {
      key: "category_view", //kodda kullacanağız
      name: "Category View", //Arayüzde kullacanağız
      grop: "CATEGORIES",
      description: "Category view ",
    },
    {
      key: "category_add", //kodda kullacanağız
      name: "Category Add", //Arayüzde kullacanağız
      grop: "CATEGORIES",
      description: "Category add ",
    },
    {
      key: "category_update", //kodda kullacanağız
      name: "Category Update", //Arayüzde kullacanağız
      grop: "CATEGORIES",
      description: "Category update ",
    },
    {
      key: "category_delete", //kodda kullacanağız
      name: "Category Delete", //Arayüzde kullacanağız
      grop: "CATEGORIES",
      description: "Category delete ",
    },
    {
      key: "auditlogs_view", //kodda kullacanağız
      name: "Auditlogs View", //Arayüzde kullacanağız
      grop: "AUDITLOGS",
      description: "Auditlogs View",
    },
  ],
};
