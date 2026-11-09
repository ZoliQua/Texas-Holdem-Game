import type { Species } from '../bots/profiles';
import type { MessageKey } from '../i18n';

/*
 * Dental mode: every character keeps its species (ears, head shape and
 * markings — the silhouette that tells them apart) and its tells, and only
 * changes clothes. Each species has its own role, so all fifteen differ.
 */

export type DentalRole =
  | 'patient' | 'toothFairy' | 'dentist' | 'hygienist' | 'bracesPatient' | 'orthodontist' | 'assistant' | 'surgeon'
  | 'labTech' | 'whitening' | 'professor' | 'toothache' | 'radiographer' | 'nurse' | 'curingBot';

export const DENTAL_ROLE: Record<Species, DentalRole> = {
  tortoise: 'patient',
  mouse: 'toothFairy',
  bear: 'dentist',
  pig: 'hygienist',
  raccoon: 'bracesPatient',
  owl: 'orthodontist',
  dog: 'assistant',
  cat: 'surgeon',
  rabbit: 'labTech',
  frog: 'whitening',
  panda: 'professor',
  penguin: 'toothache',
  wolf: 'radiographer',
  fox: 'nurse',
  robot: 'curingBot',
};

export const ROLE_KEY: Record<DentalRole, MessageKey> = {
  patient: 'rolePatient',
  toothFairy: 'roleToothFairy',
  dentist: 'roleDentist',
  hygienist: 'roleHygienist',
  bracesPatient: 'roleBracesPatient',
  orthodontist: 'roleOrthodontist',
  assistant: 'roleAssistant',
  surgeon: 'roleSurgeon',
  labTech: 'roleLabTech',
  whitening: 'roleWhitening',
  professor: 'roleProfessor',
  toothache: 'roleToothache',
  radiographer: 'roleRadiographer',
  nurse: 'roleNurse',
  curingBot: 'roleCuringBot',
};

/** Garment colour over the body and sleeves; `null` keeps the character's own fur (patients, the robot). */
export const GARMENT: Record<DentalRole, string | null> = {
  patient: null,
  toothFairy: '#e9b8f0',
  dentist: '#f4f7f8',
  hygienist: '#3fb8a4',
  bracesPatient: '#ffd166',
  orthodontist: '#cfe3fb',
  assistant: '#b8a1e3',
  surgeon: '#5aa874',
  labTech: null,
  whitening: null,
  professor: '#f4f7f8',
  toothache: null,
  radiographer: null,
  nurse: '#ffffff',
  curingBot: null,
};
