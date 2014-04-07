angular.module('drishtiSiteApp')
    .service('FPRegisterService', function ($http, $q, $moment, $filter, DRISHTI_WEB_BASE_URL, DATE_FORMAT, JSONXLSService, REGISTER_TOKENS) {
        'use strict';

        var prepareRegister = function (anm) {
            var getRegisterUrl = DRISHTI_WEB_BASE_URL + '/registers/fp?anm-id=' + anm.identifier;
            return $http({method: 'GET', url: getRegisterUrl})
                .then(function (result) {
                    return result.data;
                }, function () {
                    console.log('Error when getting FP register for anm:' + anm.identifier);
                    return $q.reject('Error when getting FP register for anm:' + anm.identifier);
                })
                .then(function (register) {
                    updateRegisterWithGeneratedDate(register);
                    updateRegisterWithLocation(register, anm);
                    updateIUDFPRegistries(register.iudRegisterEntries);
                    updateCondomFPRegistries(register.condomRegisterEntries);
                    updateOCPFPRegistries(register.ocpRegisterEntries);
                    updateMaleSterilizationFPRegistries(register.maleSterilizationRegisterEntries);
                    updateFemaleSterilizationFPRegistries(register.femaleSterilizationRegisterEntries);
                    register.endOfReportingYear = register.reportingYear + 1;
                    return JSONXLSService.prepareExcel(REGISTER_TOKENS.fp, register);
                }
            );
        };

        var updateIUDFPRegistries = function (iudFPRegistries) {
            updateFPRegistriesWithSerialNumberAndAddressDetails(iudFPRegistries);
        };

        var updateCondomFPRegistries = function (condomFPRegistries) {
            updateFPRegistriesWithSerialNumberAndAddressDetails(condomFPRegistries);
            updateRefill(condomFPRegistries);
        };

        var updateOCPFPRegistries = function (ocpFPRegistries) {
            updateFPRegistriesWithSerialNumberAndAddressDetails(ocpFPRegistries);
            updateRefill(ocpFPRegistries);
        };

        var updateMaleSterilizationFPRegistries = function (maleSterilizationFPRegistries) {
            updateFPRegistriesWithSerialNumberAndAddressDetails(maleSterilizationFPRegistries);
            updateSterilizationAndFollowupVisitDatesFormat(maleSterilizationFPRegistries);
        };

        var updateFemaleSterilizationFPRegistries = function (femaleSterilizationFPRegistries) {
            updateFPRegistriesWithSerialNumberAndAddressDetails(femaleSterilizationFPRegistries);
            updateSterilizationAndFollowupVisitDatesFormat(femaleSterilizationFPRegistries);
        };

        var updateSterilizationAndFollowupVisitDatesFormat = function (sterilizationFPRegistries) {
            sterilizationFPRegistries.forEach(function (entry) {
                entry.fpDetails.sterilizationDate = formatDate(entry.fpDetails.sterilizationDate);
                entry.fpDetails.followupVisitDates = entry.fpDetails.followupVisitDates.map(function (date) {
                    return formatDate(date);
                });
            });
        };

        var updateFPRegistriesWithSerialNumberAndAddressDetails = function (fpRegistries) {
            var serialNumber = 0;
            fpRegistries.forEach(function (entry) {
                entry.serialNumber = ++serialNumber;
                if (entry.fpDetails.fpAcceptanceDate) {
                    entry.fpDetails.fpAcceptanceDate = formatDate(entry.fpDetails.fpAcceptanceDate);
                }
                updateAddressDetails(entry);
                entry.casteReligionDetails = entry.caste ? $filter('friendlyName')(entry.caste) : '';
                entry.casteReligionDetails += (entry.caste && entry.religion) ? ' / ' : '';
                entry.casteReligionDetails += entry.religion ? $filter('friendlyName')(entry.religion) : '';
            });
        };

        var formatDate = function (date) {
            return $moment(date).format(DATE_FORMAT);
        };

        var updateRefill = function (fpRegistries) {
            fpRegistries.forEach(function (entry) {
                entry.fpDetails.refill = {};
                var months = ['apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec', 'jan', 'feb', 'mar'];
                for (var month in months) {
                    entry.fpDetails.refill[months[month]] = '';
                }
                entry.fpDetails.refills.forEach(function (refill) {
                    if (entry.fpDetails.refill[$moment(refill.date).format('MMM').toLowerCase()] !== '') {
                        entry.fpDetails.refill[$moment(refill.date).format('MMM').toLowerCase()] += '\n';
                    }
                    entry.fpDetails.refill[$moment(refill.date).format('MMM').toLowerCase()] += $moment(refill.date).format('DD MMM') + ' (' + refill.quantity + ')';
                });
            });
        };

        var updateAddressDetails = function (fpRegisterEntry) {
            var motherName = $filter('humanizeAndTitleize')(fpRegisterEntry.wifeName);
            var fatherName = fpRegisterEntry.husbandName ? ', W/O ' + $filter('humanizeAndTitleize')(fpRegisterEntry.husbandName) : '';
            var village = fpRegisterEntry.village ? ', C/O ' + $filter('humanizeAndTitleize')(fpRegisterEntry.village) : '';
            fpRegisterEntry.addressDetails = motherName + fatherName + village;
        };

        var updateRegisterWithGeneratedDate = function (register) {
            register.generatedDate = $moment().format(DATE_FORMAT);
        };

        var updateRegisterWithLocation = function (register, anm) {
            register.anmDetails = {
                location: anm.location,
                name: anm.name
            };
        };

        return {
            prepareRegister: function (anm) {
                return prepareRegister(anm);
            }
        };
    }
)
;