import { StyleSheet } from "@react-pdf/renderer";

export const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 40,
    paddingLeft: 45,
    paddingRight: 45,
    fontFamily: "Helvetica",
    fontSize: 10.5,
    lineHeight: 1.35,
    color: "#000000",
  },
  name: {
    fontFamily: "Helvetica-Bold",
    fontSize: 20,
    textAlign: "center",
    marginBottom: 4,
    lineHeight: 1.2,
  },
  contactLine: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    textAlign: "center",
    fontSize: 10,
    marginBottom: 10,
    lineHeight: 1.35,
  },
  contactLink: {
    color: "#000000",
    textDecoration: "underline",
  },
  sectionHeading: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    borderBottomWidth: 0.75,
    borderBottomColor: "#000000",
    borderBottomStyle: "solid",
    marginTop: 10,
    marginBottom: 4,
    paddingBottom: 2,
  },
  entryBlock: {
    marginBottom: 6,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    columnGap: 8,
  },
  itemTitle: {
    fontFamily: "Helvetica-Bold",
    flex: 1,
  },
  itemDate: {
    fontSize: 10,
    flexShrink: 0,
  },
  itemSubline: {
    marginBottom: 2,
    fontSize: 10.5,
  },
  skillsLine: {
    marginBottom: 2.5,
  },
  projectTitleLine: {
    marginBottom: 1,
    fontSize: 10.5,
  },
  projectLinkLine: {
    fontSize: 10,
    marginBottom: 2,
  },
  link: {
    color: "#000000",
    textDecoration: "underline",
  },
  certLine: {
    marginBottom: 2,
    fontSize: 10.5,
  },
  bulletRow: {
    flexDirection: "row",
    marginBottom: 1.5,
  },
  bulletDot: {
    width: 10,
    fontSize: 10.5,
    textAlign: "center",
  },
  bulletText: {
    flex: 1,
    fontSize: 10.5,
    lineHeight: 1.35,
  },
});
