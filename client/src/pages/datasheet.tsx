import { useLocation, useRoute } from "wouter";
import { ArrowLeft, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Real specification data parsed from the text files
const datasheetData: Record<string, any> = {
  "JKM430-455N-54HL4R-B-F8-EN_1756897795638.pdf": {
    series: "Tiger Neo 54HL4R-B",
    powerRange: "430-455 Watt",
    moduleType: "ALL BLACK MONO-FACIAL MODULE",
    cellType: "N-type Mono-crystalline",
    specifications: [
      { power: 430, vmp: "32.58V", imp: "13.20A", voc: "39.16V", isc: "13.65A", efficiency: "21.52%" },
      { power: 435, vmp: "32.78V", imp: "13.27A", voc: "39.36V", isc: "13.72A", efficiency: "21.77%" },
      { power: 440, vmp: "32.99V", imp: "13.34A", voc: "39.57V", isc: "13.80A", efficiency: "22.02%" },
      { power: 445, vmp: "33.19V", imp: "13.41A", voc: "39.77V", isc: "13.87A", efficiency: "22.27%" },
      { power: 450, vmp: "33.39V", imp: "13.48A", voc: "39.97V", isc: "13.94A", efficiency: "22.52%" },
      { power: 455, vmp: "33.58V", imp: "13.55A", voc: "40.17V", isc: "14.01A", efficiency: "22.77%" },
    ],
    mechanicalSpecs: {
      cellType: "N-type Mono-crystalline",
      cells: "108 (54×2)",
      dimensions: "1762×1134×30 mm",
      weight: "21.0 kg",
      frontGlass: "3.2mm, Anti-reflection Coating, High Transmission, Low Iron, Tempered Glass",
      frame: "Anodized Aluminium Alloy",
      junctionBox: "IP68 Rated",
      protectionClass: "Class II",
      iecFireType: "Class C",
      operatingTemp: "-40°C ~ +70°C",
      maxSystemVoltage: "1000 VDC (IEC)",
      maxSeriesFuse: "25 A",
      powerTolerance: "0 ~ +3%",
      tempCoeffPmax: "-0.29%/°C",
      tempCoeffVoc: "-0.25%/°C",
      tempCoeffIsc: "0.045%/°C"
    },
    features: [
      "N-type Technology with Tunnel Oxide Passivating Contacts (TOPcon)",
      "Lower LID/LeTID degradation and better low light performance",
      "High salt mist and ammonia resistance",
      "SMBB Technology for better light trapping and current collection",
      "HOT 3.0 Technology for better reliability and efficiency",
      "Enhanced mechanical load: 6000 Pa front, 4000 Pa rear",
      "Anti-PID guarantee"
    ],
    warranty: {
      product: "25 Year Product Warranty",
      power: "30 Year Linear Power Warranty",
      firstYearDegradation: "1%",
      annualDegradation: "0.40% over 30 years"
    },
    certifications: [
      "IEC61215:2021", "IEC61730:2023", "IEC61701", "IEC62716", 
      "IEC60068", "IEC62804", "ISO9001:2015", "ISO14001:2015", "ISO45001:2018"
    ],
    packaging: {
      palletDimensions: "1792×1140×1249 mm",
      packingDetail: "37 pcs/pallets, 74 pcs/stack, 962 pcs/40'HQ Container",
      outputCables: "4.0 mm² (+): 400 mm, (-): 200 mm",
      connectorType: "JK03M/MC4/Others"
    }
  }
};

export default function DatasheetPage() {
  const [, params] = useRoute("/datasheet/:filename");
  const [location, setLocation] = useLocation();
  
  const filename = params?.filename;
  const data = filename ? datasheetData[filename] : null;

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <Button 
            variant="outline" 
            onClick={() => setLocation("/")}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Button>
          <div className="text-center py-20">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Datasheet Not Found</h1>
            <p className="text-gray-600">The requested datasheet could not be found.</p>
          </div>
        </div>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 print:p-0 print:bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="print:hidden mb-6 flex justify-between items-center">
          <Button 
            variant="outline" 
            onClick={() => setLocation("/")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Button>
          <Button onClick={handlePrint}>
            <Download className="h-4 w-4 mr-2" />
            Print/Save PDF
          </Button>
        </div>

        {/* Header */}
        <Card className="mb-6">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <CardTitle className="text-2xl text-blue-600">JinkoSolar</CardTitle>
                <p className="text-sm text-gray-500">Technical Datasheet</p>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{data.series}</h1>
            <p className="text-xl text-gray-600">{data.powerRange}</p>
            <Badge variant="outline" className="mt-2">{data.moduleType}</Badge>
          </CardHeader>
        </Card>

        {/* Key Features */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Key Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.features.map((feature: string, index: number) => (
                <div key={index} className="flex items-start">
                  <span className="text-green-600 mr-2">•</span>
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Electrical Specifications */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Electrical Specifications (STC)</CardTitle>
            <p className="text-sm text-gray-500">STC: Irradiance 1000W/m², Cell Temperature 25°C, AM=1.5</p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Power (W)</th>
                    <th className="text-left p-2">Vmp (V)</th>
                    <th className="text-left p-2">Imp (A)</th>
                    <th className="text-left p-2">Voc (V)</th>
                    <th className="text-left p-2">Isc (A)</th>
                    <th className="text-left p-2">Efficiency</th>
                  </tr>
                </thead>
                <tbody>
                  {data.specifications.map((spec: any, index: number) => (
                    <tr key={index} className="border-b">
                      <td className="p-2 font-semibold">{spec.power}</td>
                      <td className="p-2">{spec.vmp}</td>
                      <td className="p-2">{spec.imp}</td>
                      <td className="p-2">{spec.voc}</td>
                      <td className="p-2">{spec.isc}</td>
                      <td className="p-2">{spec.efficiency}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Mechanical Specifications */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Mechanical Specifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Physical Properties</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Cell Type:</span> {data.mechanicalSpecs.cellType}</p>
                  <p><span className="font-medium">No. of Cells:</span> {data.mechanicalSpecs.cells}</p>
                  <p><span className="font-medium">Dimensions:</span> {data.mechanicalSpecs.dimensions}</p>
                  <p><span className="font-medium">Weight:</span> {data.mechanicalSpecs.weight}</p>
                  <p><span className="font-medium">Front Glass:</span> {data.mechanicalSpecs.frontGlass}</p>
                  <p><span className="font-medium">Frame:</span> {data.mechanicalSpecs.frame}</p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Electrical Properties</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Junction Box:</span> {data.mechanicalSpecs.junctionBox}</p>
                  <p><span className="font-medium">Protection Class:</span> {data.mechanicalSpecs.protectionClass}</p>
                  <p><span className="font-medium">Operating Temp:</span> {data.mechanicalSpecs.operatingTemp}</p>
                  <p><span className="font-medium">Max System Voltage:</span> {data.mechanicalSpecs.maxSystemVoltage}</p>
                  <p><span className="font-medium">Max Series Fuse:</span> {data.mechanicalSpecs.maxSeriesFuse}</p>
                  <p><span className="font-medium">Power Tolerance:</span> {data.mechanicalSpecs.powerTolerance}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Temperature Coefficients */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Temperature Coefficients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <p className="font-semibold">Pmax</p>
                <p className="text-lg text-blue-600">{data.mechanicalSpecs.tempCoeffPmax}</p>
              </div>
              <div className="text-center">
                <p className="font-semibold">Voc</p>
                <p className="text-lg text-blue-600">{data.mechanicalSpecs.tempCoeffVoc}</p>
              </div>
              <div className="text-center">
                <p className="font-semibold">Isc</p>
                <p className="text-lg text-blue-600">{data.mechanicalSpecs.tempCoeffIsc}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Warranty Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Warranty Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-center">
                <h4 className="text-lg font-semibold text-blue-600">{data.warranty.product}</h4>
                <p className="text-sm text-gray-600 mt-1">Product Warranty</p>
              </div>
              <div className="text-center">
                <h4 className="text-lg font-semibold text-green-600">{data.warranty.power}</h4>
                <p className="text-sm text-gray-600 mt-1">Linear Power Warranty</p>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <p><span className="font-medium">First-year Degradation:</span> {data.warranty.firstYearDegradation}</p>
              <p><span className="font-medium">Annual Degradation:</span> {data.warranty.annualDegradation}</p>
            </div>
          </CardContent>
        </Card>

        {/* Certifications */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Certifications & Standards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.certifications.map((cert: string, index: number) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {cert}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Packaging Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Packaging Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p><span className="font-medium">Pallet Dimensions:</span> {data.packaging.palletDimensions}</p>
                <p><span className="font-medium">Packing Detail:</span> {data.packaging.packingDetail}</p>
              </div>
              <div>
                <p><span className="font-medium">Output Cables:</span> {data.packaging.outputCables}</p>
                <p><span className="font-medium">Connector Type:</span> {data.packaging.connectorType}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 mt-8">
          <p>© 2024 Jinko Solar Co., Ltd. All rights reserved.</p>
          <p>www.jinkosolar.com</p>
          <p className="mt-2">Note: Please read the safety and installation manual before using the product. The specifications in this datasheet are subject to change without notice.</p>
        </div>
      </div>
    </div>
  );
}