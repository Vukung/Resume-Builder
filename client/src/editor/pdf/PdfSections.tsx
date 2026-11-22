import React from "react";
import { Text, View, Link } from "@react-pdf/renderer";
import {
  HeaderModel,
  SummarySectionModel,
  EducationSectionModel,
  EducationEntryModel,
  SkillsSectionModel,
  ExperienceSectionModel,
  ExperienceEntryModel,
  ProjectsSectionModel,
  ProjectEntryModel,
  CertificationsSectionModel,
} from "../shared/resumeModel";
import { styles } from "./pdfStyles";
import { splitLongWords } from "./pdfUtils";

export const BulletItem: React.FC<{ text: string }> = ({ text }) => (
  <View wrap={false} style={styles.bulletRow}>
    <Text style={styles.bulletDot}>•</Text>
    <Text style={styles.bulletText}>{splitLongWords(text)}</Text>
  </View>
);

export const ResumeHeader: React.FC<{ header: HeaderModel }> = ({ header }) => {
  const hasName = Boolean(header.name);
  const hasContact = header.contactParts.length > 0;

  return (
    <View wrap={false}>
      {hasName ? <Text style={styles.name}>{splitLongWords(header.name)}</Text> : null}
      {hasContact ? (
        <View style={styles.contactLine}>
          {header.contactParts.map((part, index) => (
            <React.Fragment key={index}>
              {index > 0 ? <Text> | </Text> : null}
              {part.href ? (
                <Link src={part.href} style={styles.contactLink}>
                  {splitLongWords(part.text)}
                </Link>
              ) : (
                <Text>{splitLongWords(part.text)}</Text>
              )}
            </React.Fragment>
          ))}
        </View>
      ) : null}
    </View>
  );
};

export const SummarySection: React.FC<{ section: SummarySectionModel }> = ({ section }) => (
  <View wrap={false} style={styles.entryBlock}>
    <Text style={styles.sectionHeading}>{section.title}</Text>
    <Text style={styles.itemSubline}>{splitLongWords(section.text)}</Text>
  </View>
);

export const EducationEntry: React.FC<{ entry: EducationEntryModel }> = ({ entry }) => (
  <View wrap={false} style={styles.entryBlock}>
    <View style={styles.row}>
      <Text style={styles.itemTitle}>{splitLongWords(entry.institution)}</Text>
      {entry.dates ? <Text style={styles.itemDate}>{splitLongWords(entry.dates)}</Text> : null}
    </View>
    {entry.subline ? <Text style={styles.itemSubline}>{splitLongWords(entry.subline)}</Text> : null}
  </View>
);

export const EducationSection: React.FC<{ section: EducationSectionModel }> = ({ section }) => {
  const [first, ...rest] = section.entries;
  return (
    <View>
      <View wrap={false}>
        <Text style={styles.sectionHeading}>{section.title}</Text>
        {first ? <EducationEntry entry={first} /> : null}
      </View>
      {rest.map((entry) => (
        <EducationEntry key={entry.id} entry={entry} />
      ))}
    </View>
  );
};

export const SkillsSection: React.FC<{ section: SkillsSectionModel }> = ({ section }) => {
  const [first, ...rest] = section.entries;
  const renderItem = (entry: (typeof section.entries)[0]) => (
    <View key={entry.id} wrap={false} style={styles.skillsLine}>
      <Text>
        {entry.category ? (
          <>
            <Text style={styles.itemTitle}>{splitLongWords(entry.category)}: </Text>
            <Text>{splitLongWords(entry.itemsText)}</Text>
          </>
        ) : (
          <Text>{splitLongWords(entry.itemsText)}</Text>
        )}
      </Text>
    </View>
  );

  return (
    <View>
      <View wrap={false}>
        <Text style={styles.sectionHeading}>{section.title}</Text>
        {first ? renderItem(first) : null}
      </View>
      {rest.map(renderItem)}
    </View>
  );
};

export const ExperienceEntry: React.FC<{ entry: ExperienceEntryModel }> = ({ entry }) => (
  <View style={styles.entryBlock}>
    <View wrap={false}>
      <View style={styles.row}>
        <Text style={styles.itemTitle}>{splitLongWords(entry.jobTitle)}</Text>
        {entry.dates ? <Text style={styles.itemDate}>{splitLongWords(entry.dates)}</Text> : null}
      </View>
      {entry.company ? <Text style={styles.itemSubline}>{splitLongWords(entry.company)}</Text> : null}
    </View>
    {entry.bullets.map((bullet, idx) => (
      <BulletItem key={idx} text={bullet} />
    ))}
  </View>
);

export const ExperienceSection: React.FC<{ section: ExperienceSectionModel }> = ({ section }) => {
  const [first, ...rest] = section.entries;
  return (
    <View>
      <View wrap={false}>
        <Text style={styles.sectionHeading}>{section.title}</Text>
        {first ? (
          <View wrap={false}>
            <View style={styles.row}>
              <Text style={styles.itemTitle}>{splitLongWords(first.jobTitle)}</Text>
              {first.dates ? <Text style={styles.itemDate}>{splitLongWords(first.dates)}</Text> : null}
            </View>
            {first.company ? <Text style={styles.itemSubline}>{splitLongWords(first.company)}</Text> : null}
          </View>
        ) : null}
      </View>
      {first ? first.bullets.map((bullet, idx) => <BulletItem key={idx} text={bullet} />) : null}
      {rest.map((entry) => (
        <ExperienceEntry key={entry.id} entry={entry} />
      ))}
    </View>
  );
};

export const ProjectEntry: React.FC<{ entry: ProjectEntryModel }> = ({ entry }) => (
  <View style={styles.entryBlock}>
    <View wrap={false}>
      <Text style={styles.projectTitleLine}>
        <Text style={styles.itemTitle}>{splitLongWords(entry.name)}</Text>
        {entry.techStack ? <Text> | {splitLongWords(entry.techStack)}</Text> : null}
      </Text>
      {entry.linkText ? (
        <Text style={styles.projectLinkLine}>
          {entry.linkHref ? (
            <Link src={entry.linkHref} style={styles.link}>
              {splitLongWords(entry.linkText)}
            </Link>
          ) : (
            splitLongWords(entry.linkText)
          )}
        </Text>
      ) : null}
    </View>
    {entry.bullets.map((bullet, idx) => (
      <BulletItem key={idx} text={bullet} />
    ))}
  </View>
);

export const ProjectsSection: React.FC<{ section: ProjectsSectionModel }> = ({ section }) => {
  const [first, ...rest] = section.entries;
  return (
    <View>
      <View wrap={false}>
        <Text style={styles.sectionHeading}>{section.title}</Text>
        {first ? (
          <View wrap={false}>
            <Text style={styles.projectTitleLine}>
              <Text style={styles.itemTitle}>{splitLongWords(first.name)}</Text>
              {first.techStack ? <Text> | {splitLongWords(first.techStack)}</Text> : null}
            </Text>
            {first.linkText ? (
              <Text style={styles.projectLinkLine}>
                {first.linkHref ? (
                  <Link src={first.linkHref} style={styles.link}>
                    {splitLongWords(first.linkText)}
                  </Link>
                ) : (
                  splitLongWords(first.linkText)
                )}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>
      {first ? first.bullets.map((bullet, idx) => <BulletItem key={idx} text={bullet} />) : null}
      {rest.map((entry) => (
        <ProjectEntry key={entry.id} entry={entry} />
      ))}
    </View>
  );
};

export const CertificationsSection: React.FC<{ section: CertificationsSectionModel }> = ({
  section,
}) => {
  const [first, ...rest] = section.entries;
  const renderItem = (entry: (typeof section.entries)[0]) => (
    <View key={entry.id} wrap={false} style={styles.certLine}>
      <Text>
        <Text style={styles.itemTitle}>{splitLongWords(entry.name)}</Text>
        {entry.issuer ? <Text> - {splitLongWords(entry.issuer)}</Text> : null}
      </Text>
    </View>
  );

  return (
    <View>
      <View wrap={false}>
        <Text style={styles.sectionHeading}>{section.title}</Text>
        {first ? renderItem(first) : null}
      </View>
      {rest.map(renderItem)}
    </View>
  );
};
