import { Button } from "../components/ui/button";

export default function Success() {
    return (
        <div className="success">
            <span className="mb-4 text-2xl font-bold text-green-700">Success</span>
            <Button>
                <a href="/">Back</a> 
            </Button>            
        </div>
    )
}