angular.module('drishtiSiteApp')
    .service('RegisterService', function ($http, $q, DRISHTI_WEB_BASE_URL, JSON_TO_XLS_BASE_URL, REGISTER_TOKENS) {
        'use strict';

        var getFPUsers = function (allECs) {
            var fpUsers = {
                iudUsers: [],
                condomUsers: [],
                ocpUsers: [],
                maleSterilizationUsers: [],
                femaleSterilizationUsers: []
            };
            allECs.forEach(function (ec) {
                ec.wifeAge =
                    Math.floor((new Date() - new Date(Date.parse(ec.wifeDOB))) / 1000 / 60 / 60 / 24 / 365);
                ec.husbandAge =
                    Math.floor((new Date() - new Date(Date.parse(ec.husbandDOB))) / 1000 / 60 / 60 / 24 / 365);
                if (ec.fpDetails.method === 'iud') {
                    fpUsers.iudUsers.push(ec);
                } else if (ec.fpDetails.method === 'condom') {
                    fpUsers.condomUsers.push(ec);
                } else if (ec.fpDetails.method === 'ocp') {
                    fpUsers.ocpUsers.push(ec);
                } else if (ec.fpDetails.method === 'male_sterilization') {
                    fpUsers.maleSterilizationUsers.push(ec);
                } else if (ec.fpDetails.method === 'female_sterilization') {
                    fpUsers.femaleSterilizationUsers.push(ec);
                }
            });
            return fpUsers;
        };

        var prepareRegisterFor = function (anmIdentifier, type) {
            var getRegisterUrl = DRISHTI_WEB_BASE_URL + '/registers/' + type + '?anm-id=' + anmIdentifier;

            return $http({method: 'GET', url: getRegisterUrl})
                .then(function (result) {
                    return result.data;
                }, function () {
                    console.log('Error when getting register for anm:' + anmIdentifier + ', type:' + type);
                    return $q.reject('Error when getting register for anm:' + anmIdentifier + ', type:' + type);
                })
                .then(function (register) {
                    register.ancRegisterEntries.forEach(function (entry) {
                        createANCServicesList(entry);
                        fillMissingValues(entry);
                    });
                    return $http({method: 'POST', url: JSON_TO_XLS_BASE_URL + '/xls/' + REGISTER_TOKENS[type], data: register})
                        .then(function (result) {
                            return JSON_TO_XLS_BASE_URL + result.data;
                        }, function () {
                            console.log('Error when getting register from json-to-xls service.');
                            return $q.reject('Error when getting register from json-to-xls service.');
                        });
                }
            );
        };

        var fillMissingValues = function (entry) {
            var services = ['tt', 'ifa', 'ancVisits', 'remarks', 'contentHolder'];
            var servicesLength = [];
            services.forEach(function (service) {
                if (!entry[service]) entry[service] = [];
                servicesLength.push(entry[service].length);
            });
            entry['maxLength'] = _.max(servicesLength);
            services.forEach(function (service) {
                fillValuesToMatchLength(entry, service);
            });
            return entry;
        };

        var fillValuesToMatchLength = function (entry, service) {
            entry[service] = entry[service].concat(_(entry['maxLength'] - entry[service].length).times(function () {
                return {};
            }));
        };

        var createANCServicesList = function (entry) {
            entry['ancVisits'] = [
                {
                    "ancVisitDate": "23/5/2014",
                    "weight": "34",
                    "bp": "233",
                    "hb": "567",
                    "urineSugar": "23",
                    "urineAlbumin": "11",
                    "rti": "22",
                    "sti": "33"
                },
                {
                    "ancVisitDate": "23/6/2014",
                    "weight": "343",
                    "bp": "233",
                    "hb": "567",
                    "urineSugar": "23",
                    "urineAlbumin": "11",
                    "rti": "22",
                    "sti": "33"
                }
            ];
            entry['tt'] = [
                {
                    "dose": "TT1",
                    "date": "23/5/2014"
                },
                {
                    "dose": "TT2",
                    "date": "23/5/2014"
                },
                {
                    "dose": "TT3",
                    "date": "23/5/2014"
                }
            ];
            entry['ifa'] = [
                {
                    "numberOfTablets": "12",
                    "date": "22/12/2015"
                },
                {
                    "numberOfTablets": "12",
                    "date": "22/12/2015"
                }
            ];
            entry['remarks'] = [
                {
                    "remark": "Good"
                }
            ]
        };

        return {
            fpUsers: function (allECs) {
                return getFPUsers(allECs);
            },
            prepareRegisterFor: function (anmIdentifier, type) {
                return prepareRegisterFor(anmIdentifier, type);
            },
            fillMissingValues: function (register) {
                return fillMissingValues(register);
            }
        };
    });